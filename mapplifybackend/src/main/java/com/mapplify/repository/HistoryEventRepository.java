package com.mapplify.repository;

import com.mapplify.model.HistoryEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HistoryEventRepository extends JpaRepository<HistoryEvent, Long> {
    List<HistoryEvent> findTop300ByOrderByCreatedAtDesc();
}
