package com.insightloop.feedbackservice.interaction;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InteractionRepository extends JpaRepository<Interaction, Long> {
    List<Interaction> findAllByOrderByIdDesc();
}
