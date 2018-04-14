package io.ntf.api.activity.model;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;

import java.util.List;
import java.util.stream.Stream;

public interface ActivityRepository extends JpaRepository<Activity, Long> {

  List<Activity> findByUserIdOrderByStartDesc(String userId);
}
