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

    public record UpdateEscalationRequest(String status, Long assigneeUserId, String priority) {}

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
                             @RequestHeader(value = org.springframework.http.HttpHeaders.AUTHORIZATION, required = false) String authHeader) {
        Escalation e = repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (req.status() != null) {
            e.setStatus(req.status());
            if ("RESOLVED".equals(req.status())) {
                e.setClosedAt(Instant.now());
                updateCommitmentStatus(e.getCommitmentId(), "RESOLVED", authHeader);
            } else if ("OPEN".equals(req.status()) || "IN_PROGRESS".equals(req.status())) {
                updateCommitmentStatus(e.getCommitmentId(), "ESCALATED", authHeader);
            }
        }
        if (req.assigneeUserId() != null) e.setAssigneeUserId(req.assigneeUserId());
        if (req.priority() != null) e.setPriority(req.priority());
        return repo.save(e);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public Escalation edit(@PathVariable Long id, 
                           @Valid @RequestBody EditEscalationRequest req,
                           @RequestHeader(value = org.springframework.http.HttpHeaders.AUTHORIZATION, required = false) String authHeader) {
        Escalation e = repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        e.setCustomerName(req.customerName());
        e.setSummary(req.summary());
        if (req.priority() != null) e.setPriority(req.priority());
        if (req.slaHours() != null) e.setSlaHours(req.slaHours());
        if (req.status() != null) {
            e.setStatus(req.status());
            if ("RESOLVED".equals(req.status())) {
                e.setClosedAt(Instant.now());
                updateCommitmentStatus(e.getCommitmentId(), "RESOLVED", authHeader);
            } else if ("OPEN".equals(req.status()) || "IN_PROGRESS".equals(req.status())) {
                updateCommitmentStatus(e.getCommitmentId(), "ESCALATED", authHeader);
            }
        }
        return repo.save(e);
    }

    private void updateCommitmentStatus(Long commitmentId, String status, String authHeader) {
        try {
            validationClient.put()
                    .uri("/commitments/" + commitmentId)
                    .header(org.springframework.http.HttpHeaders.AUTHORIZATION, authHeader == null ? "" : authHeader)
                    .bodyValue(java.util.Map.of("status", status))
                    .retrieve()
                    .toBodilessEntity()
                    .block();
        } catch (Exception ignored) {
            // Ignore if validation service is unreachable or errors out
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Escalation not found");
        }
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
