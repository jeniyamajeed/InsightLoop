package com.insightloop.validationservice.commitment;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.servlet.http.HttpServletRequest;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
public class CommitmentController {

    private final CommitmentRepository repo;
    private final CommitmentAuditRepository auditRepo;
    private final ValidationService svc;

    public CommitmentController(CommitmentRepository repo, CommitmentAuditRepository auditRepo, ValidationService svc) {
        this.repo = repo; this.auditRepo = auditRepo; this.svc = svc;
    }

    public record CreateCommitmentRequest(
            @JsonProperty("customerName") @NotBlank String customerName,
            @JsonProperty("commitmentType") @NotBlank String commitmentType,
            @JsonProperty("description") @NotBlank @Size(max = 500) String description,
            @JsonProperty("dueAt") @NotNull Instant dueAt) {}

    public record RespondRequest(
            @JsonProperty("resolved") @NotNull Boolean resolved,
            @JsonProperty("comment") @Size(max = 1000) String comment) {}

    @GetMapping("/commitments")
    public List<Commitment> list(@RequestParam(required = false) String status) {
        return status == null ? repo.findAll() : repo.findByStatus(status);
    }

    @PostMapping("/commitments")
    @PreAuthorize("hasAnyRole('AGENT','ADMIN','MANAGER')")
    public ResponseEntity<Commitment> create(@Valid @RequestBody CreateCommitmentRequest req, Authentication auth) {
        Commitment c = new Commitment();
        c.setCustomerName(req.customerName());
        c.setCommitmentType(req.commitmentType());
        c.setDescription(req.description());
        c.setDueAt(req.dueAt());
        if (auth != null && auth.getPrincipal() instanceof Long id) c.setOwnerUserId(id);
        c = repo.save(c);
        svc.log(c.getId(), "CREATED", "Commitment created for " + c.getCustomerName());
        return ResponseEntity.status(HttpStatus.CREATED).body(c);
    }

    @GetMapping("/commitments/{id}")
    public Map<String, Object> detail(@PathVariable Long id) {
        Commitment c = repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        return Map.of("commitment", c, "audit", auditRepo.findByCommitmentIdOrderByAtAsc(id));
    }

    @PostMapping("/validations/{commitmentId}/respond")
    public Commitment respond(@PathVariable Long commitmentId, @Valid @RequestBody RespondRequest req,
                              HttpServletRequest servletReq) {
        if (!repo.existsById(commitmentId)) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return svc.respond(commitmentId, req.resolved(), req.comment(), servletReq.getHeader("Authorization"));
    }

    @GetMapping("/analytics/summary")
    public Map<String, Object> summary(HttpServletRequest request) {
        return svc.dashboardSummary(request.getHeader("Authorization"));
    }
    public record UpdateCommitmentRequest(
            @JsonProperty("customerName") @Size(max = 200) String customerName,
            @JsonProperty("commitmentType") @Size(max = 100) String commitmentType,
            @JsonProperty("description") @Size(max = 500) String description,
            @JsonProperty("dueAt") Instant dueAt,
            @JsonProperty("status") @Pattern(regexp = "PENDING|VALIDATION_SENT|RESOLVED|REJECTED|ESCALATED|UNRESOLVED") String status) {}

    @PutMapping("/commitments/{id}")
    @PreAuthorize("hasAnyRole('AGENT','ADMIN','MANAGER')")
    public Commitment update(@PathVariable Long id, @Valid @RequestBody UpdateCommitmentRequest req,
                              @RequestParam(value = "sync", defaultValue = "true") boolean sync,
                              @RequestHeader(value = org.springframework.http.HttpHeaders.AUTHORIZATION, required = false) String authHeader) {
        Commitment c = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        if (req.customerName()   != null) c.setCustomerName(req.customerName());
        if (req.commitmentType() != null) c.setCommitmentType(req.commitmentType());
        if (req.description()    != null) c.setDescription(req.description());
        if (req.dueAt()          != null) c.setDueAt(req.dueAt());
        if (req.status()         != null) {
            if ("ESCALATED".equals(req.status()) && c.getLinkedEscalationId() == null) {
                c.setStatus("UNRESOLVED");
            } else {
                c.setStatus(req.status());
            }
        }

        c = repo.save(c);
        svc.log(c.getId(), "UPDATED", "Commitment updated");

        if (sync && c.getLinkedEscalationId() != null) {
            svc.syncToEscalation(c, authHeader);
        }

        return c;
    }

    @DeleteMapping("/commitments/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                        @RequestParam(value = "sync", defaultValue = "true") boolean sync,
                                        @RequestHeader(value = org.springframework.http.HttpHeaders.AUTHORIZATION, required = false) String authHeader) {
        Commitment c = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Commitment not found"));

        if (sync && c.getLinkedEscalationId() != null) {
            svc.deleteEscalation(c.getLinkedEscalationId(), authHeader);
        }

        auditRepo.deleteByCommitmentId(id);
        repo.delete(c);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/commitments/{id}/escalation")
    public Commitment unlinkEscalation(@PathVariable Long id) {
        Commitment c = repo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        c.setLinkedEscalationId(null);
        if ("ESCALATED".equals(c.getStatus())) {
            c.setStatus("UNRESOLVED");
        }
        c = repo.save(c);
        svc.log(c.getId(), "UNLINKED_ESCALATION", "Linked escalation removed");
        return c;
    }
}
