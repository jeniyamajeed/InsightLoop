package com.insightloop.validationservice.commitment;

import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.List;

public interface CommitmentRepository extends JpaRepository<Commitment, Long> {
    List<Commitment> findByStatus(String status);
    List<Commitment> findByStatusAndDueAtBefore(String status, Instant t);
    long countByStatus(String status);
    long countByStatusAndDueAtBefore(String status, Instant t);
}
