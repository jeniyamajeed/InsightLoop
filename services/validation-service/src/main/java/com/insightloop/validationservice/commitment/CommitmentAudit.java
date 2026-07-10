package com.insightloop.validationservice.commitment;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "commitment_audit")
public class CommitmentAudit {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private Long commitmentId;
    @Column(nullable = false, length = 64)
    private String event; // CREATED, VALIDATION_SENT, CUSTOMER_RESPONDED, ESCALATED
    @Column(length = 500)
    private String detail;
    @Column(nullable = false)
    private Instant at = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getCommitmentId() { return commitmentId; }
    public void setCommitmentId(Long commitmentId) { this.commitmentId = commitmentId; }
    public String getEvent() { return event; }
    public void setEvent(String event) { this.event = event; }
    public String getDetail() { return detail; }
    public void setDetail(String detail) { this.detail = detail; }
    public Instant getAt() { return at; }
    public void setAt(Instant at) { this.at = at; }
}
