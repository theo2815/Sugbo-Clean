(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    var STATUS_ORDER = ['Pending', 'In Progress', 'Resolved'];
    var sysId = request.pathParams.sys_id;
    var body = request.body.data;
    var next = body && body.status;

    if (STATUS_ORDER.indexOf(next) === -1) {
        response.setStatus(400);
        response.setBody({ error: 'Invalid status. Must be Pending, In Progress, or Resolved.' });
        return;
    }

    var gr = new GlideRecord('x_1986056_sugbocle_report');
    if (!gr.get(sysId)) {
        response.setStatus(404);
        response.setBody({ error: 'Report not found' });
        return;
    }

    var current = gr.getValue('u_status');
    var currentIdx = STATUS_ORDER.indexOf(current);
    var nextIdx = STATUS_ORDER.indexOf(next);

    if (nextIdx < currentIdx) {
        response.setStatus(400);
        response.setBody({ error: 'Status flow is forward-only: ' + current + ' cannot move back to ' + next + '.' });
        return;
    }

    if (nextIdx === currentIdx) {
        response.setBody({
            result: {
                sys_id: gr.getUniqueValue(),
                report_code: gr.getValue('u_report_code'),
                status: current
            }
        });
        return;
    }

    gr.setValue('u_status', next);
    gr.update();
    response.setBody({
        result: {
            sys_id: gr.getUniqueValue(),
            report_code: gr.getValue('u_report_code'),
            status: gr.getValue('u_status')
        }
    });

})(request, response);