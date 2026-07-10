package com.insightloop.escalationservice.escalation;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/escalations")
public class EscalationController {

    private final EscalationRepository repo;
    private final WebClient validationClient;

    public EscalationController(EscalationRepository repo,
                                @Value("${insightloop.validation-service-url:http://localhost:8083}") String valUrl) {
        this.repo = repo;
        this.validationClient = WebClient.builder().baseUrl(valUrl).build();
    }

    public record CreateEscalationRequest(
            @NotNull Long commitmentId,
            @NotBlank String customerName,
            @NotBlank @Size(max = 500) String summary,
            String priority,
            Integer slaHours) {}

    public record EditEscalationRequest(
            @NotBlank String customerName,
            @NotBlank @Size(max = 500) String summary,
            String priority,
            Integer slaHours,
            String status) {}

    public record UpdateEscalationRequest(String status, Long assigneeUserId, String priority, String customerName, String summary) {}

    @GetMapping
    @PreAuthorize("hasAnyRole('AGENT','ADMIN','MANAGER')")
    public List<Escalation> list() { return repo.findAll(); }

    @PostMapping
    public ResponseEntity<Escalation> create(@Valid @RequestBody CreateEscalationRequest req) {
        Escalation e = new Escalation();
        e.setCommitmentId(req.commitmentId());
        e.setCustomerName(req.customerName());
        e.setSummary(req.summary());
        if (req.priority() != null) e.setPriority(req.priority());
        if (req.slaHours() != null) e.setSlaHours(req.slaHours());
        return ResponseEntity.status(HttpStatus.CREATED).body(repo.save(e));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('AGENT','ADMIN','MANAGER')")
    public Escalation update(@PathVariable Long id, 
                             @RequestBody UpdateEscalationRequest req,
                             @RequestParam(value = "sync", defaultValue = "true") boolean sync,
                             @RequestHeader(value = org.springframework.http.HttpHeaders.AUTHORIZATION, required = false) String authHeader) {
        Escalation e = repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        String targetStatus = null;
        if (req.status() != null) {
            e.setStatus(req.status());
            if ("RESOLVED".equals(req.status())) {
                e.setClosedAt(Instant.now());
                targetStatus = "RESOLVED";
            } else if ("OPEN".equals(req.status()) || "IN_PROGRESS".equals(req.status())) {
                targetStatus = "ESCALATED";
            }
        }
        if (req.assigneeUserId() != null) e.setAssigneeUserId(req.assigneeUserId());
        if (req.priority() != null) e.setPriority(req.priority());
        if (req.customerName() != null) e.setCustomerName(req.customerName());
        if (req.summary() != null) e.setSummary(req.summary());

        e = repo.save(e);
        if (sync) {
            updateCommitment(e.getCommitmentId(), req.customerName(), req.summary(), targetStatus, authHeader);
        }
        return e;
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public Escalation edit(@PathVariable Long id, 
                           @Valid @RequestBody EditEscalationRequest req,
                           @RequestParam(value = "sync", defaultValue = "true") boolean sync,
                           @RequestHeader(value = org.springframework.http.HttpHeaders.AUTHORIZATION, required = false) String authHeader) {
        Escalation e = repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        e.setCustomerName(req.customerName());
        e.setSummary(req.summary());
        if (req.priority() != null) e.setPriority(req.priority());
        if (req.slaHours() != null) e.setSlaHours(req.slaHours());
        String targetStatus = null;
        if (req.status() != null) {
            e.setStatus(req.status());
            if ("RESOLVED".equals(req.status())) {
                e.setClosedAt(Instant.now());
                targetStatus = "RESOLVED";
            } else if ("OPEN".equals(req.status()) || "IN_PROGRESS".equals(req.status())) {
                targetStatus = "ESCALATED";
            }
        }
        e = repo.save(e);
        if (sync) {
            updateCommitment(e.getCommitmentId(), req.customerName(), req.summary(), targetStatus, authHeader);
        }
        return e;
    }

    private void updateCommitment(Long commitmentId, String customerName, String description, String status, String authHeader) {
        if (customerName == null && description == null && status == null) return;
        try {
            java.util.Map<String, Object> body = new java.util.HashMap<>();
            if (customerName != null) body.put("customerName", customerName);
            if (description != null) {
                String cleanDesc = description;
                if (cleanDesc.startsWith("Unresolved commitment: ")) {
                    cleanDesc = cleanDesc.substring("Unresolved commitment: ".length());
                }
                body.put("description", cleanDesc);
            }
            if (status != null) body.put("status", status);

            validationClient.put()
                    .uri(uriBuilder -> uriBuilder
                            .path("/commitments/" + commitmentId)
                            .queryParam("sync", "false")
                            .build())
                    .header(org.springframework.http.HttpHeaders.AUTHORIZATION, authHeader == null ? "" : authHeader)
                    .bodyValue(body)
                    .retrieve()
                    .toBodilessEntity()
                    .block();
        } catch (Exception ignored) {
            // Ignore if validation service is unreachable or errors out
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                        @RequestHeader(value = org.springframework.http.HttpHeaders.AUTHORIZATION, required = false) String authHeader) {
        Escalation e = repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Escalation not found"));
        
        try {
            validationClient.delete()
                    .uri(uriBuilder -> uriBuilder
                            .path("/commitments/" + e.getCommitmentId())
                            .queryParam("sync", "false")
                            .build())
                    .header(org.springframework.http.HttpHeaders.AUTHORIZATION, authHeader == null ? "" : authHeader)
                    .retrieve()
                    .toBodilessEntity()
                    .block();
        } catch (Exception ignored) {}

        repo.delete(e);
        return ResponseEntity.noContent().build();
    }
}
