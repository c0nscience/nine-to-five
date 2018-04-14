package io.ntf.api.activity;

import io.ntf.api.activity.model.Activity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.security.Principal;

@RestController
public class ActivityResource {

  private ActivityService activityService;

  public ActivityResource(ActivityService activityService) {
    this.activityService = activityService;
  }

  @GetMapping("/activities")
  public Flux<Activity> getAllActivities(Mono<Principal> principal) {
    return principal
      .map(Principal::getName)
      .flatMapMany(name -> activityService.findByUserId(name));
  }

  /**
   * def start: Action[JsValue] = (Action andThen hasScope("start:activity")).async(parse.json) { implicit request =>
   * request.body.validate[StartDataTransferObject].fold(
   * errors => {
   * Future.successful(BadRequest(Json.obj("status" -> "KO", "message" -> JsError.toJson(errors))))
   * },
   * start => {
   * activityDAO.findRunning(request.userId)
   * .flatMap(maybeRunningActivity => maybeRunningActivity
   * .map(_ => Future.successful(BadRequest("Can not start new activity while another is running.")))
   * .getOrElse(activityDAO
   * .insert(Activity(userId = request.userId, name = start.name, start = LocalDateTime.now(ZoneOffset.UTC)))
   * .map(Json.toJson(_))
   * .map(Created(_))
   * )
   * )
   * }
   * )
   * }
   */
  @PostMapping("/activity")
  public Mono<Activity> start() {
    return Mono.empty();
  }

}
