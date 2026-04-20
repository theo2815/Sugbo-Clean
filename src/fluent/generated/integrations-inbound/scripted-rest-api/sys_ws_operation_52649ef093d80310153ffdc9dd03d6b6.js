(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    var body = request.body.data || {};
    var email = (body.email || '').toString().trim().toLowerCase();
    var schedules = Array.isArray(body.schedules) ? body.schedules : [];

    if (!email) {
        response.setStatus(400);
        response.setBody({ error: { message: 'Email is required' } });
        return;
    }

    if (!schedules.length) {
        response.setStatus(400);
        response.setBody({ error: { message: 'At least one schedule must be selected' } });
        return;
    }

    var created = 0;
    var reactivated = 0;
    var alreadyActive = 0;
    var invalid = 0;

    for (var i = 0; i < schedules.length; i++) {
        var scheduleId = (schedules[i] || '').toString().trim();
        if (!scheduleId) { invalid++; continue; }

        // Verify schedule exists and resolve its barangay for convenience
        var schedGr = new GlideRecord('x_1986056_sugbocle_schedule');
        if (!schedGr.get(scheduleId)) { invalid++; continue; }
        var barangayId = schedGr.getValue('u_barangay');

        var gr = new GlideRecord('x_1986056_sugbocle_reminder_subscription');
        gr.addQuery('u_email', email);
        gr.addQuery('u_schedule', scheduleId);
        gr.query();

        if (gr.next()) {
            if (gr.getValue('u_active') == '1' || gr.getValue('u_active') === true) {
                alreadyActive++;
            } else {
                gr.setValue('u_active', true);
                gr.setValue('u_last_sent_at', '');
                gr.update();
                reactivated++;
            }
            continue;
        }

        gr.initialize();
        gr.setValue('u_email', email);
        gr.setValue('u_schedule', scheduleId);
        if (barangayId) gr.setValue('u_barangay', barangayId);
        gr.setValue('u_active', true);
        gr.insert();
        created++;
    }

    var total = created + reactivated + alreadyActive;
    var parts = [];
    if (created) parts.push(created + ' new');
    if (reactivated) parts.push(reactivated + ' reactivated');
    if (alreadyActive) parts.push(alreadyActive + ' already active');
    var message = total
        ? 'Subscribed: ' + parts.join(', ') + '.'
        : 'No valid schedules were provided.';

    response.setStatus(total ? 201 : 400);
    response.setBody({
        result: {
            created: created,
            reactivated: reactivated,
            alreadyActive: alreadyActive,
            invalid: invalid,
            total: total,
            message: message
        }
    });

})(request, response);
