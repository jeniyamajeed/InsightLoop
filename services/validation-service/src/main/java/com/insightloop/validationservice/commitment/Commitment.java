package com.insightloop.validationservice.commitment;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "commitments")
public class Commitment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 190)
    private String customerName;

    @Column(nullable = false, length = 64)
    private String commitmentType; // REFUND, CARD_REPLACEMENT, ACCOUNT_CORRECTION, TECHNICIAN_VISIT, SERVICE_ACTIVATION

    @Column(nullable = false, length = 500)
    private String description;

    @Column(name = "owner_user_id")
    private Long ownerUserId;

    @Column(nullable = false)
    private Instant dueAt;

    @Column(nullable = false, length = 32)
    private String status = "PENDING"; // PENDING, VALIDATION_SENT, RESOLVED, UNRESOLVED, ESCALATED

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    private Instant validationSentAt;
    private Instant validationRespondedAt;
    private Boolean customerResolvedResponse;
    @Column(length = 1000)
    private String customerResponseComment;
    private Long linkedEscalationId;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getCommitmentType() { return commitmentType; }
    public void setCommitmentType(String commitmentType) { this.commitmentType = commitmentType; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Long getOwnerUserId() { return ownerUserId; }
    public void setOwnerUserId(Long ownerUserId) { this.ownerUserId = ownerUserId; }
    public Instant getDueAt() { return dueAt; }
    public void setDueAt(Instant dueAt) { this.dueAt = dueAt; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getValidationSentAt() { return validationSentAt; }
    public void setValidationSentAt(Instant validationSentAt) { this.validationSentAt = validationSentAt; }
    public Instant getValidationRespondedAt() { return validationRespondedAt; }
    public void setValidationRespondedAt(Instant validationRespondedAt) { this.validationRespondedAt = validationRespondedAt; }
    public Boolean getCustomerResolvedResponse() { return customerResolvedResponse; }
    public void setCustomerResolvedResponse(Boolean customerResolvedResponse) { this.customerResolvedResponse = customerResolvedResponse; }
    public String getCustomerResponseComment() { return customerResponseComment; }
    public void setCustomerResponseComment(String customerResponseComment) { this.customerResponseComment = customerResponseComment; }
    public Long getLinkedEscalationId() { return linkedEscalationId; }
    public void setLinkedEscalationId(Long linkedEscalationId) { this.linkedEscalationId = linkedEscalationId; }
}
