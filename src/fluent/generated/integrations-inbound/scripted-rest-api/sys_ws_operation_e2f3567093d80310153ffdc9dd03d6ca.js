(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {

    var ALLOWED_WASTE_TYPES = ['Biodegradable', 'Recyclable', 'Residual'];
    var DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
    var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    var SYS_ID_PATTERN = /^[a-f0-9]{32}$/i;

    function fail(status, message) {
        response.setStatus(status);
        response.setBody({ error: { message: message } });
    }

    var body = request.body.data || {};

    var description = body.description ? String(body.description).trim() : '';
    if (!description) return fail(400, 'Description is required.');
    if (description.length > 4000) return fail(400, 'Description is too long (max 4000 characters).');

    var barangay = body.barangay ? String(body.barangay).trim() : '';
    if (!barangay) return fail(400, 'Barangay is required.');
    if (!SYS_ID_PATTERN.test(barangay)) return fail(400, 'Barangay reference is invalid.');

    var missedDate = body.missed_date ? String(body.missed_date).trim() : '';
    if (!missedDate) return fail(400, 'Missed date is required.');
    if (!DATE_PATTERN.test(missedDate)) return fail(400, 'Missed date must be in YYYY-MM-DD format.');

    var wasteType = body.waste_type ? String(body.waste_type).trim() : '';
    if (!wasteType) return fail(400, 'Waste type is required.');
    if (ALLOWED_WASTE_TYPES.indexOf(wasteType) === -1) {
        return fail(400, 'Waste type must be Biodegradable, Recyclable, or Residual.');
    }

    var email = body.email ? String(body.email).trim() : '';
    if (email && !EMAIL_PATTERN.test(email)) return fail(400, 'Email format is invalid.');

    var gr = new GlideRecord('x_1986056_sugbocle_report');
    gr.initialize();
    gr.setValue('u_barangay', barangay);
    gr.setValue('u_missed_date', missedDate);
    gr.setValue('u_waste_type', wasteType);
    gr.setValue('u_email', email);
    gr.setValue('u_description', description);
    gr.setValue('u_status', 'Pending');
    gr.insert();

    response.setStatus(201);
    response.setBody({
        result: {
            sys_id: gr.getUniqueValue(),
            report_code: gr.getValue('u_report_code')
        }
    });

})(request, response);
