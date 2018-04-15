package io.ntf.api.statistics;

import io.ntf.api.activity.ActivityService;
import io.ntf.api.activity.model.Activity;
import io.ntf.api.statistics.model.UserConfiguration;
import io.ntf.api.statistics.model.UserConfigurationRepository;
import io.ntf.api.statistics.model.WorkTimeConfiguration;
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
      .collectList()
      .map(List::ofAll)
      .zipWith(userConfigurationRepository.findByUserId(userId).defaultIfEmpty(defaultUserConfiguration()))
      .map(t -> {
        List<Activity> activities = t.getT1();
        final WorkTimeConfiguration workTimeConfiguration = t.getT2().getWorkTimeConfiguration();
        final LocalDate beginOfOvertimeCalculation = workTimeConfiguration.getBeginOfOvertimeCalculation();

        return activities
          .filter(a -> a.getStart().toLocalDate().isAfter(beginOfOvertimeCalculation) || a.getStart().toLocalDate().isEqual(beginOfOvertimeCalculation))
          .groupBy(activity -> {
            WeekFields weekFields = WeekFields.ISO;
            int weekOfYear = activity.getStart().get(weekFields.weekOfYear());
            int year = activity.getStart().getYear();

            return LocalDate.now()
              .withYear(year)
              .with(weekFields.weekOfYear(), weekOfYear)
              .with(weekFields.dayOfWeek(), 1);
          })
          .map(activitiesByWeek -> activitiesByWeek.map2(a -> a.map(Activity::duration).reduce(Duration::plus)))
          .map(tpl -> Match(tpl).of(
            Case($Tuple2($(), $()), (week, totalWorkTime) -> {
              Duration workingHoursPerWeek = Duration.of(workTimeConfiguration.getWorkingHoursPerWeek(), ChronoUnit.HOURS);
              Duration overtime = totalWorkTime.minus(workingHoursPerWeek);
              return Overtime.builder()
                .week(week)
                .totalWorkTime(totalWorkTime)
                .overtime(overtime)
                .build();
            })
          ))
          .sortBy(Overtime::getWeek)
          .foldLeft(List.empty(), (result, current) -> Match(result).of(
            Case($Nil(), () -> List.of(current.withTotalOvertime(current.getOvertime()))),
            Case($Cons($(), $()), (previous, tail) -> result.prepend(current.withTotalOvertime(current.getOvertime().plus(previous.getTotalOvertime()))))
          ));
      });
  }

  private UserConfiguration defaultUserConfiguration() {
    return UserConfiguration.builder()
      .workTimeConfiguration(WorkTimeConfiguration.builder()
        .beginOfOvertimeCalculation(LocalDate.MIN)
        .workingHoursPerWeek(40L)
        .build())
      .build();
  }
}
