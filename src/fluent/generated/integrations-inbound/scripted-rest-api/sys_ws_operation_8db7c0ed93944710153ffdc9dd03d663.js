(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    var sysId = request.pathParams.sys_id;
    var gr = new GlideRecord('x_1986056_sugbocle_barangay');

    if (gr.get(sysId)) {
        gr.deleteRecord();
        response.setBody({ result: { message: 'Deleted' } });
    } else {
        response.setStatus(404);
        response.setBody({ error: 'Barangay not found' });
    }

})(request, response);