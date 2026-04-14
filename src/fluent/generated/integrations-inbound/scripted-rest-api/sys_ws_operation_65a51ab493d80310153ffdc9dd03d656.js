(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    var sysId = request.pathParams.sys_id;
    var gr = new GlideRecord('x_1986056_sugbocle_hauler');

    if (gr.get(sysId)) {
        gr.deleteRecord();
        response.setBody({ result: { message: 'Deleted' } });
    } else {
        response.setStatus(404);
        response.setBody({ error: 'Hauler not found' });
    }

})(request, response);