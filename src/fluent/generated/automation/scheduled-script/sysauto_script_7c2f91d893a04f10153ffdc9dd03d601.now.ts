import { ScheduledScript } from '@servicenow/sdk/core'

ScheduledScript({
    $id: Now.ID['7c2f91d893a04f10153ffdc9dd03d601'],
    name: 'SugboClean Pickup Reminder Dispatcher',
    active: true,
    frequency: 'periodically',
    executionInterval: { minutes: 5 },
    script: `(function run() {
    var DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var WINDOW_MIN = 60;      // fire up to 60 minutes ahead of pickup
    var DEDUPE_HOURS = 22;    // do not resend to same subscription within 22h

    // Compute current Manila (UTC+8) day + minutes-of-day
    var nowUtcMs = new GlideDateTime().getNumericValue();
    var manilaMs = nowUtcMs + (8 * 3600 * 1000);
    var manilaDate = new Date(manilaMs);
    var todayName = DAY_NAMES[manilaDate.getUTCDay()];
    var nowMin = manilaDate.getUTCHours() * 60 + manilaDate.getUTCMinutes();

    gs.info('[SugboReminder] Manila today=' + todayName + ' nowMin=' + nowMin +
        ' (' + manilaDate.getUTCHours() + ':' + manilaDate.getUTCMinutes() + ')');

    // Find every schedule whose pickup starts within (0, WINDOW_MIN] minutes from now (Manila)
    var sched = new GlideRecord('x_1986056_sugbocle_schedule');
    sched.addQuery('u_day_of_week', todayName);
    sched.query();

    while (sched.next()) {
        var startRaw = sched.getValue('u_time_window_start') || '';
        var m = startRaw.match(/(\\d{2}):(\\d{2})/);
        if (!m) continue;
        var startMin = parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
        var diff = startMin - nowMin;
        gs.info('[SugboReminder] schedule=' + sched.getUniqueValue() +
            ' timePart=' + startRaw + ' startMin=' + startMin + ' diff=' + diff);

        if (diff <= 0 || diff > WINDOW_MIN) continue;

        // Fire for each active subscription on this schedule, respecting dedupe
        var sub = new GlideRecord('x_1986056_sugbocle_reminder_subscription');
        sub.addQuery('u_schedule', sched.getUniqueValue());
        sub.addQuery('u_active', true);
        sub.query();

        while (sub.next()) {
            var email = sub.getValue('u_email');
            if (!email) continue;

            var lastSent = sub.getValue('u_last_sent_at');
            if (lastSent) {
                var lastMs = new GlideDateTime(lastSent).getNumericValue();
                if ((nowUtcMs - lastMs) < (DEDUPE_HOURS * 3600 * 1000)) {
                    gs.info('[SugboReminder] skip dedupe sub=' + sub.getUniqueValue());
                    continue;
                }
            }

            gs.eventQueue(
                'x_1986056_sugbocle.pickup_reminder',
                sub,
                email,
                sched.getUniqueValue()
            );

            sub.setValue('u_last_sent_at', new GlideDateTime());
            sub.update();
            gs.info('[SugboReminder] queued email=' + email + ' schedule=' + sched.getUniqueValue());
        }
    }
})();`,
})
