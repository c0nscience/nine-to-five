package io.ntf.api.statistics;

import io.ntf.api.activity.ActivityService;
import io.ntf.api.activity.model.Activity;
import io.ntf.api.statistics.model.UserConfigurationRepository;
import io.vavr.Tuple;
import io.vavr.collection.List;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.time.temporal.WeekFields;

import static io.vavr.API.*;
import static io.vavr.Patterns.*;


@Service
public class StatisticsService {

  private final ActivityService activityService;
  private final UserConfigurationRepository userConfigurationRepository;


  public StatisticsService(ActivityService activityService, UserConfigurationRepository userConfigurationRepository) {
    this.activityService = activityService;
    this.userConfigurationRepository = userConfigurationRepository;
  }

  Mono<List<Overtime>> overtime(String userId) {
    return activityService.findByUserId(userId)
      .groupBy(activity -> {
        WeekFields weekFields = WeekFields.ISO;
        int weekOfYear = activity.getStart().get(weekFields.weekOfYear());
        int year = activity.getStart().getYear();

        return LocalDate.now()
          .withYear(year)
          .with(weekFields.weekOfYear(), weekOfYear)
          .with(weekFields.dayOfWeek(), 1);
      })
      .flatMap(activitiesByWeek -> activitiesByWeek.map(Activity::duration).reduce(Duration::plus)
        .map(duration -> Tuple.of(activitiesByWeek.key(), duration))
      )
      .map(tpl -> Match(tpl).of(
        Case($Tuple2($(), $()), (week, totalWorkTime) -> {
          Duration workingHoursPerWeek = Duration.of(40L, ChronoUnit.HOURS);
          Duration overtime = totalWorkTime.minus(workingHoursPerWeek);
          return Overtime.builder()
            .week(week)
            .totalWorkTime(totalWorkTime)
            .overtime(overtime)
            .build();
        })
      ))
      .collectList()
      .map(List::ofAll)
      .map(overtimes -> overtimes.sortBy(Overtime::getWeek))
      .map(overtimes -> overtimes.foldLeft(List.empty(), (result, current) -> Match(result).of(
        Case($Nil(), () -> List.of(current.withTotalOvertime(current.getOvertime()))),
        Case($Cons($(), $()), (previous, tail) -> result.prepend(current.withTotalOvertime(current.getOvertime().plus(previous.getTotalOvertime()))))
      )));
  }
}
