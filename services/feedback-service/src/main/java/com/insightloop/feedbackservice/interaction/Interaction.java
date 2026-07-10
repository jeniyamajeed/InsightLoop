package com.insightloop.feedbackservice.interaction;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "interactions")
public class Interaction {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 190)
    private String customerName;
    @Column(nullable = false, length = 32)
    private String channel; // CALL, CHAT, EMAIL
    @Column(nullable = false, length = 500)
    private String summary;
    @Column(name = "agent_user_id")
    private Long agentUserId;
    private Integer csatScore;      // null until feedback given
    @Column(length = 1000)
    private String csatComment;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();
    private Instant feedbackAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getChannel() { return channel; }
    public void setChannel(String channel) { this.channel = channel; }
    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
    public Long getAgentUserId() { return agentUserId; }
    public void setAgentUserId(Long agentUserId) { this.agentUserId = agentUserId; }
    public Integer getCsatScore() { return csatScore; }
    public void setCsatScore(Integer csatScore) { this.csatScore = csatScore; }
    public String getCsatComment() { return csatComment; }
    public void setCsatComment(String csatComment) { this.csatComment = csatComment; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getFeedbackAt() { return feedbackAt; }
    public void setFeedbackAt(Instant feedbackAt) { this.feedbackAt = feedbackAt; }
}
