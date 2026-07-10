package com.insightloop.escalationservice.escalation;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "escalations")
public class Escalation {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private Long commitmentId;
    @Column(nullable = false, length = 190)
    private String customerName;
    @Column(nullable = false, length = 500)
    private String summary;
    @Column(nullable = false, length = 8)
    private String priority = "P1"; // P1, P2, P3
    @Column(nullable = false)
    private Integer slaHours = 4;
    @Column(nullable = false, length = 32)
    private String status = "OPEN"; // OPEN, IN_PROGRESS, RESOLVED
    private Long assigneeUserId;
    @Column(nullable = false)
    private Instant createdAt = Instant.now();
    private Instant closedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getCommitmentId() { return commitmentId; }
    public void setCommitmentId(Long commitmentId) { this.commitmentId = commitmentId; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public Integer getSlaHours() { return slaHours; }
    public void setSlaHours(Integer slaHours) { this.slaHours = slaHours; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Long getAssigneeUserId() { return assigneeUserId; }
    public void setAssigneeUserId(Long assigneeUserId) { this.assigneeUserId = assigneeUserId; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getClosedAt() { return closedAt; }
    public void setClosedAt(Instant closedAt) { this.closedAt = closedAt; }
}
