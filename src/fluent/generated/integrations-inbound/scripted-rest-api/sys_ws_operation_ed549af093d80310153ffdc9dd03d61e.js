(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    var haulerId = request.queryParams.hauler_id;
    var barangayId = request.queryParams.barangay_id;
    var scheduleId = request.queryParams.schedule;
    var list = [];
    var gr = new GlideRecord('x_1986056_sugbocle_route_stop');

    if (haulerId) {
        gr.addQuery('u_hauler', haulerId);
    }
    if (barangayId) {
        gr.addQuery('u_barangay', barangayId);
    }
    if (scheduleId) {
        gr.addQuery('u_schedule', String(scheduleId));
    }

    gr.orderBy('u_stop_order');
    gr.query();

    while (gr.next()) {
        list.push({
            sys_id: gr.getUniqueValue(),
            hauler: gr.getDisplayValue('u_hauler'),
            hauler_id: gr.getValue('u_hauler'),
            barangay: gr.getDisplayValue('u_barangay'),
            barangay_id: gr.getValue('u_barangay'),
            label: gr.getValue('u_label'),
            latitude: parseFloat(gr.getValue('u_latitude')) || null,
            longitude: parseFloat(gr.getValue('u_longitude')) || null,
            stop_order: parseInt(gr.getValue('u_stop_order')) || 0,
            point_type: gr.getValue('u_point_type'),
            estimated_arrival: gr.getValue('u_estimated_arrival'),
            stop_status: gr.getValue('u_stop_status'),
            schedule: {
                value: gr.getValue('u_schedule'),
                display_value: gr.getDisplayValue('u_schedule')
            },
            offset_minutes: parseInt(gr.getValue('u_offset_minutes') || 0, 10)
        });
    }

    response.setBody({ result: list });

})(request, response);