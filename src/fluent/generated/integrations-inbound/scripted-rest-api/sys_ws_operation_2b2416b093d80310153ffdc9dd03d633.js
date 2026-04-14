(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    var sysId = request.pathParams.sys_id;
    var body = request.body.data;
    var gr = new GlideRecord('x_1986056_sugbocle_report');

    if (gr.get(sysId)) {
        gr.setValue('u_status', body.status);
        gr.update();
        response.setBody({
            result: {
                sys_id: gr.getUniqueValue(),
                report_code: gr.getValue('u_report_code'),
                status: gr.getValue('u_status')
            }
        });
    } else {
        response.setStatus(404);
        response.setBody({ error: 'Report not found' });
    }

})(request, response);