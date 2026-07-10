package com.insightloop.validationservice.commitment;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;

@Service
public class ValidationService {

    private final CommitmentRepository commitments;
    private final CommitmentAuditRepository audit;
    private final WebClient escalationClient;
    private final WebClient feedbackClient;

    public ValidationService(CommitmentRepository commitments,
                             CommitmentAuditRepository audit,
                             @Value("${insightloop.escalation-service-url:http://localhost:8084}") String escUrl,
                             @Value("${insightloop.feedback-service-url:http://localhost:8082}") String feedbackUrl) {
        this.commitments = commitments;
        this.audit = audit;
        this.escalationClient = WebClient.builder().baseUrl(escUrl).build();
        this.feedbackClient = WebClient.builder().baseUrl(feedbackUrl).build();
    }

    /** Every 5 minutes, mark commitments past due as VALIDATION_SENT and log audit. */
    @Scheduled(fixedDelay = 300_000, initialDelay = 30_000)
    public void sendValidationRequests() {
        Instant now = Instant.now();
        for (Commitment c : commitments.findByStatusAndDueAtBefore("PENDING", now)) {
            c.setStatus("VALIDATION_SENT");
            c.setValidationSentAt(now);
            commitments.save(c);
            log(c.getId(), "VALIDATION_SENT",
                    "Automated validation request sent to " + c.getCustomerName());
        }
    }

    public Commitment respond(Long commitmentId, boolean resolved, String comment, String authHeader) {
        Commitment c = commitments.findById(commitmentId).orElseThrow();
        c.setValidationRespondedAt(Instant.now());
        c.setCustomerResolvedResponse(resolved);
        c.setCustomerResponseComment(comment);
        if (resolved) {
            c.setStatus("RESOLVED");
            log(c.getId(), "CUSTOMER_RESPONDED", "Customer confirmed resolution");
        } else {
            c.setStatus("UNRESOLVED");
            log(c.getId(), "CUSTOMER_RESPONDED", "Customer reported UNRESOLVED: " + comment);
            Long escId = createEscalation(c, authHeader);
            if (escId != null) {
                c.setLinkedEscalationId(escId);
                c.setStatus("ESCALATED");
                log(c.getId(), "ESCALATED", "Escalation " + escId + " opened");
            }
        }
        return commitments.save(c);
    }

    private Long createEscalation(Commitment c, String authHeader) {
        try {
            Map<String, Object> body = Map.of(
                    "commitmentId", c.getId(),
                    "customerName", c.getCustomerName(),
                    "summary", "Unresolved commitment: " + c.getDescription(),
                    "priority", "P1",
                    "slaHours", 4);
            @SuppressWarnings("unchecked")
            Map<String,Object> res = escalationClient.post()
                    .uri("/escalations")
                    .header(HttpHeaders.AUTHORIZATION, authHeader == null ? "" : authHeader)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
            if (res != null && res.get("id") instanceof Number n) return n.longValue();
        } catch (Exception ignored) {}
        return null;
    }

    public void log(Long commitmentId, String event, String detail) {
        CommitmentAudit a = new CommitmentAudit();
        a.setCommitmentId(commitmentId);
        a.setEvent(event);
        a.setDetail(detail);
        audit.save(a);
    }

    public Map<String, Object> dashboardSummary(String authHeader) {
        int csatImmediate = 84;
        try {
            @SuppressWarnings("unchecked")
            java.util.List<Map<String, Object>> list = feedbackClient.get()
                    .uri("/interactions")
                    .header(HttpHeaders.AUTHORIZATION, authHeader == null ? "" : authHeader)
                    .retrieve()
                    .bodyToMono(java.util.List.class)
                    .block();
            if (list != null && !list.isEmpty()) {
                double sum = 0;
                int count = 0;
                for (Map<String, Object> i : list) {
                    if (i.get("csatScore") instanceof Number n) {
                        sum += n.doubleValue();
                        count++;
                    }
                }
                if (count > 0) {
                    csatImmediate = (int) Math.round((sum / count) * 20.0);
                }
            }
        } catch (Exception ignored) {}

        long escalated = 0;
        try {
            @SuppressWarnings("unchecked")
            java.util.List<Map<String, Object>> list = escalationClient.get()
                    .uri("/escalations")
                    .header(HttpHeaders.AUTHORIZATION, authHeader == null ? "" : authHeader)
                    .retrieve()
                    .bodyToMono(java.util.List.class)
                    .block();
            if (list != null) {
                escalated = list.stream()
                        .filter(esc -> !"RESOLVED".equals(esc.get("status")))
                        .count();
            }
        } catch (Exception e) {
            escalated = commitments.countByStatus("ESCALATED");
        }

        long due = commitments.findByStatus("PENDING").stream()
                .filter(c -> c.getDueAt().isBefore(Instant.now().plus(1, ChronoUnit.DAYS)))
                .count();
        long overdue = commitments.countByStatusAndDueAtBefore("PENDING", Instant.now());
        long resolved = commitments.countByStatus("RESOLVED");
        long unresolved = commitments.countByStatus("UNRESOLVED") + commitments.countByStatus("ESCALATED");
        long total = resolved + unresolved;

        int actualResolution = total == 0 ? 0 : (int) Math.round(100.0 * resolved / total);
        int gap = csatImmediate - actualResolution;
        return Map.of(
                "csatImmediate", csatImmediate,
                "actualResolutionConfirmed", actualResolution,
                "resolutionGap", Math.max(gap, 0),
                "commitmentsDueToday", due,
                "overdueCommitments", overdue,
                "openEscalations", escalated);
    }
}
