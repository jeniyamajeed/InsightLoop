package com.insightloop.feedbackservice.interaction;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/interactions")
public class InteractionController {

    private final InteractionRepository repo;
    public InteractionController(InteractionRepository repo) { this.repo = repo; }

    public record CreateInteractionRequest(
            @NotBlank String customerName,
            @NotBlank String channel,
            @NotBlank @Size(max = 500) String summary,
            @com.fasterxml.jackson.annotation.JsonProperty("csatScore") Integer csatScore,
            @com.fasterxml.jackson.annotation.JsonProperty("csatComment") String csatComment) {}

    public record FeedbackRequest(
            @com.fasterxml.jackson.annotation.JsonProperty("score") @NotNull @Min(1) @Max(5) Integer score,
            @com.fasterxml.jackson.annotation.JsonProperty("comment") @Size(max = 1000) String comment) {}

    @GetMapping
    public List<Interaction> list() { return repo.findAllByOrderByIdDesc(); }

    @GetMapping("/{id}")
    public Interaction get(@PathVariable Long id) {
        return repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('AGENT','ADMIN')")
    public ResponseEntity<Interaction> create(@Valid @RequestBody CreateInteractionRequest req, Authentication auth) {
        Interaction i = new Interaction();
        i.setCustomerName(req.customerName());
        i.setChannel(req.channel());
        i.setSummary(req.summary());
        if (req.csatScore() != null) {
            i.setCsatScore(req.csatScore());
            i.setCsatComment(req.csatComment());
            i.setFeedbackAt(Instant.now());
        }
        if (auth != null && auth.getPrincipal() instanceof Long id) i.setAgentUserId(id);
        return ResponseEntity.status(HttpStatus.CREATED).body(repo.save(i));
    }

    @PostMapping("/{id}/feedback")
    public Interaction feedback(@PathVariable Long id, @Valid @RequestBody FeedbackRequest req) {
        Interaction i = repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (i.getCsatScore() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Feedback already captured");
        }
        i.setCsatScore(req.score());
        i.setCsatComment(req.comment());
        i.setFeedbackAt(Instant.now());
        return repo.save(i);
    }

    public record UpdateInteractionRequest(
            @NotBlank String customerName,
            @NotBlank String channel,
            @NotBlank @Size(max = 500) String summary,
            @com.fasterxml.jackson.annotation.JsonProperty("csatScore") Integer csatScore,
            @com.fasterxml.jackson.annotation.JsonProperty("csatComment") String csatComment) {}

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('AGENT','ADMIN','MANAGER')")
    public Interaction update(@PathVariable Long id, @Valid @RequestBody UpdateInteractionRequest req) {
        Interaction i = repo.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        i.setCustomerName(req.customerName());
        i.setChannel(req.channel());
        i.setSummary(req.summary());
        i.setCsatScore(req.csatScore());
        i.setCsatComment(req.csatComment());
        if (req.csatScore() != null) {
            i.setFeedbackAt(Instant.now());
        } else {
            i.setFeedbackAt(null);
        }
        return repo.save(i);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Interaction not found");
        }
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
