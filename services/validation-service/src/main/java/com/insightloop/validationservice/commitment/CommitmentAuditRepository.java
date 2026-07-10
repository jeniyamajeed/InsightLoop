package com.insightloop.validationservice.commitment;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CommitmentAuditRepository extends JpaRepository<CommitmentAudit, Long> {
    List<CommitmentAudit> findByCommitmentIdOrderByAtAsc(Long commitmentId);
    @org.springframework.transaction.annotation.Transactional
    void deleteByCommitmentId(Long commitmentId);
}
