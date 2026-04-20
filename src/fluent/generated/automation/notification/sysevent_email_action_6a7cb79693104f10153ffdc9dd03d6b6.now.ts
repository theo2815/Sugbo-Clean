import { EmailNotification } from '@servicenow/sdk/core'

EmailNotification({
    $id: Now.ID['6a7cb79693104f10153ffdc9dd03d6b6'],
    table: 'x_1986056_sugbocle_reminder_subscription',
    name: 'SugboClean Pickup Reminder',
    category: 'c97d83137f4432005f58108c3ffa917a',
    triggerConditions: {
        generationType: 'event',
        eventName: 'x_1986056_sugbocle.pickup_reminder',
        item: 'event.parm1',
    },
    recipientDetails: {
        excludeDelegates: false,
        isSubscribableByAllUsers: false,
        sendToCreator: false,
        eventParm1WithRecipient: true,
        eventParm2WithRecipient: false,
    },
    emailContent: {
        messageHtml: `<p>Hello,</p>
<p>Your scheduled waste collection for <strong>\${u_barangay}</strong> is coming up soon.</p>
<p>\${mail_script:sugboclean_pickup_reminder_details}</p>
<p>Please have your bins ready at the curb before the window starts.</p>
<hr>
<p style="color: #6b7280; font-size: 13px;">Don't want these reminders? <a href="https://dev375738.service-now.com/api/x_1
  986056_sugbocle/sugboclean_api/reminders/unsubscribe?token=\${u_unsubscribe_token}">Unsubscribe here</a></p>
<p style="color: #6b7280; font-size: 13px;">&mdash; SugboClean &middot; Keeping Sugbo clean, one pickup at a time.</p>`,
        subject: 'Pickup reminder — ${u_barangay} today',
        includeAttachments: false,
        omitWatermark: false,
        pushMessageOnly: false,
        forceDelivery: false,
    },
})
