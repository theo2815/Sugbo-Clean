// All mock data shapes match the real ServiceNow API responses exactly.

export const mockBarangays = [
  { sys_id: 'brgy-001', name: 'Lahug', zone: 'North District' },
  { sys_id: 'brgy-002', name: 'Mabolo', zone: 'North District' },
  { sys_id: 'brgy-003', name: 'Banilad', zone: 'North District' },
  { sys_id: 'brgy-004', name: 'Talamban', zone: 'North District' },
  { sys_id: 'brgy-005', name: 'Capitol Site', zone: 'South District' },
  { sys_id: 'brgy-006', name: 'Labangon', zone: 'South District' },
  { sys_id: 'brgy-007', name: 'Guadalupe', zone: 'South District' },
  { sys_id: 'brgy-008', name: 'Tisa', zone: 'South District' },
];

export const mockHaulers = [
  {
    sys_id: 'haul-001',
    name: 'Cebu Green Haulers',
    contact_number: '0917-123-4567',
    areas_covered: 'Lahug, Mabolo, Banilad, Talamban',
  },
  {
    sys_id: 'haul-002',
    name: 'Metro Waste Solutions',
    contact_number: '0932-987-6543',
    areas_covered: 'Capitol Site, Labangon, Guadalupe, Tisa',
  },
  {
    sys_id: 'haul-003',
    name: 'Island Clean Services',
    contact_number: '0918-555-7890',
    areas_covered: 'Banilad, Talamban, Guadalupe',
  },
];

export const mockSchedules = [
  { sys_id: 'sched-001', barangay: 'Lahug', hauler: 'Cebu Green Haulers', waste_type: 'Biodegradable', day_of_week: 'Monday', time_window_start: '06:00', time_window_end: '09:00' },
  { sys_id: 'sched-002', barangay: 'Lahug', hauler: 'Cebu Green Haulers', waste_type: 'Residual', day_of_week: 'Thursday', time_window_start: '06:00', time_window_end: '09:00' },
  { sys_id: 'sched-003', barangay: 'Mabolo', hauler: 'Cebu Green Haulers', waste_type: 'Biodegradable', day_of_week: 'Tuesday', time_window_start: '07:00', time_window_end: '10:00' },
  { sys_id: 'sched-004', barangay: 'Capitol Site', hauler: 'Metro Waste Solutions', waste_type: 'Recyclable', day_of_week: 'Wednesday', time_window_start: '06:00', time_window_end: '08:00' },
  { sys_id: 'sched-005', barangay: 'Banilad', hauler: 'Island Clean Services', waste_type: 'Biodegradable', day_of_week: 'Monday', time_window_start: '07:00', time_window_end: '09:30' },
  { sys_id: 'sched-006', barangay: 'Talamban', hauler: 'Cebu Green Haulers', waste_type: 'Recyclable', day_of_week: 'Friday', time_window_start: '06:00', time_window_end: '08:00' },
  { sys_id: 'sched-007', barangay: 'Guadalupe', hauler: 'Metro Waste Solutions', waste_type: 'Residual', day_of_week: 'Saturday', time_window_start: '05:00', time_window_end: '08:00' },
  { sys_id: 'sched-008', barangay: 'Tisa', hauler: 'Metro Waste Solutions', waste_type: 'Biodegradable', day_of_week: 'Tuesday', time_window_start: '06:00', time_window_end: '09:00' },
];

export const mockReports = [
  { sys_id: 'rpt-001', report_code: 'SC-2026-0001', barangay: 'Banilad', missed_date: '2026-04-15', waste_type: 'Recyclable', status: 'Pending', email: 'juan@email.com', description: 'Truck did not come this morning.', created_on: '2026-04-15 08:30:00' },
  { sys_id: 'rpt-002', report_code: 'SC-2026-0002', barangay: 'Talamban', missed_date: '2026-04-14', waste_type: 'Biodegradable', status: 'In Progress', email: 'maria@email.com', description: 'No collection since Monday.', created_on: '2026-04-14 09:00:00' },
  { sys_id: 'rpt-003', report_code: 'SC-2026-0003', barangay: 'Lahug', missed_date: '2026-04-13', waste_type: 'Residual', status: 'Resolved', email: '', description: 'Missed residual pickup on Gorordo Ave.', created_on: '2026-04-13 07:15:00' },
  { sys_id: 'rpt-004', report_code: 'SC-2026-0004', barangay: 'Mabolo', missed_date: '2026-04-12', waste_type: 'Biodegradable', status: 'Pending', email: 'pedro@email.com', description: 'Green bin was not collected.', created_on: '2026-04-12 10:00:00' },
  { sys_id: 'rpt-005', report_code: 'SC-2026-0005', barangay: 'Capitol Site', missed_date: '2026-04-10', waste_type: 'Recyclable', status: 'In Progress', email: '', description: 'Recycling truck skipped our area.', created_on: '2026-04-10 06:45:00' },
  { sys_id: 'rpt-006', report_code: 'SC-2026-0006', barangay: 'Guadalupe', missed_date: '2026-04-08', waste_type: 'Residual', status: 'Resolved', email: 'ana@email.com', description: 'Black bin left untouched for 2 days.', created_on: '2026-04-08 11:30:00' },
  { sys_id: 'rpt-007', report_code: 'SC-2026-0007', barangay: 'Labangon', missed_date: '2026-04-05', waste_type: 'Biodegradable', status: 'Resolved', email: '', description: 'No pickup last Monday.', created_on: '2026-04-05 08:00:00' },
  { sys_id: 'rpt-008', report_code: 'SC-2026-0008', barangay: 'Tisa', missed_date: '2026-04-03', waste_type: 'Recyclable', status: 'Pending', email: 'carlos@email.com', description: 'Blue bins still full.', created_on: '2026-04-03 07:30:00' },
  { sys_id: 'rpt-009', report_code: 'SC-2026-0009', barangay: 'Lahug', missed_date: '2026-04-01', waste_type: 'Biodegradable', status: 'In Progress', email: 'lisa@email.com', description: 'Food waste not collected in 3 days.', created_on: '2026-04-01 09:15:00' },
  { sys_id: 'rpt-010', report_code: 'SC-2026-0010', barangay: 'Banilad', missed_date: '2026-03-28', waste_type: 'Residual', status: 'Resolved', email: '', description: 'General waste pickup missed.', created_on: '2026-03-28 10:00:00' },
  { sys_id: 'rpt-011', report_code: 'SC-2026-0011', barangay: 'Talamban', missed_date: '2026-03-25', waste_type: 'Recyclable', status: 'Pending', email: 'jose@email.com', description: 'Recyclables overflowing on the curb.', created_on: '2026-03-25 06:00:00' },
  { sys_id: 'rpt-012', report_code: 'SC-2026-0012', barangay: 'Mabolo', missed_date: '2026-03-22', waste_type: 'Biodegradable', status: 'In Progress', email: '', description: 'Compost bin not emptied.', created_on: '2026-03-22 08:45:00' },
];

export const mockWasteItems = [
  { sys_id: 'wi-001', name: 'Banana Peel', bin_type: 'Biodegradable', bin_color: 'Green', disposal_instructions: 'Place in green bin. Composts naturally.' },
  { sys_id: 'wi-002', name: 'Rice Leftovers', bin_type: 'Biodegradable', bin_color: 'Green', disposal_instructions: 'Place in green bin. Avoid mixing with plastic.' },
  { sys_id: 'wi-003', name: 'Vegetable Scraps', bin_type: 'Biodegradable', bin_color: 'Green', disposal_instructions: 'Place in green bin. Great for composting.' },
  { sys_id: 'wi-004', name: 'Fallen Leaves', bin_type: 'Biodegradable', bin_color: 'Green', disposal_instructions: 'Collect in green bin or compost pile.' },
  { sys_id: 'wi-005', name: 'Plastic Bottle', bin_type: 'Recyclable', bin_color: 'Blue', disposal_instructions: 'Rinse clean and place in blue bin. Remove cap.' },
  { sys_id: 'wi-006', name: 'Newspaper', bin_type: 'Recyclable', bin_color: 'Blue', disposal_instructions: 'Keep dry and place in blue bin.' },
  { sys_id: 'wi-007', name: 'Glass Jar', bin_type: 'Recyclable', bin_color: 'Blue', disposal_instructions: 'Rinse and remove lid. Place in blue bin.' },
  { sys_id: 'wi-008', name: 'Metal Can', bin_type: 'Recyclable', bin_color: 'Blue', disposal_instructions: 'Rinse and flatten if possible. Blue bin.' },
  { sys_id: 'wi-009', name: 'Styrofoam', bin_type: 'Residual', bin_color: 'Black', disposal_instructions: 'Place in black bin. Not recyclable.' },
  { sys_id: 'wi-010', name: 'Disposable Diapers', bin_type: 'Residual', bin_color: 'Black', disposal_instructions: 'Wrap securely and place in black bin.' },
  { sys_id: 'wi-011', name: 'Soiled Wrappers', bin_type: 'Residual', bin_color: 'Black', disposal_instructions: 'Place in black bin. Cannot be recycled.' },
  { sys_id: 'wi-012', name: 'Broken Ceramics', bin_type: 'Residual', bin_color: 'Black', disposal_instructions: 'Wrap in paper to prevent injury. Black bin.' },
  { sys_id: 'wi-013', name: 'Used Batteries', bin_type: 'Hazardous', bin_color: 'Red', disposal_instructions: 'Bring to designated drop-off point. Do NOT mix with regular waste.' },
  { sys_id: 'wi-014', name: 'Expired Medicine', bin_type: 'Hazardous', bin_color: 'Red', disposal_instructions: 'Return to pharmacy or hazardous waste collection.' },
  { sys_id: 'wi-015', name: 'Paint Cans', bin_type: 'Hazardous', bin_color: 'Red', disposal_instructions: 'Let dry completely. Bring to hazardous waste drop-off.' },
  { sys_id: 'wi-016', name: 'Fluorescent Bulbs', bin_type: 'Hazardous', bin_color: 'Red', disposal_instructions: 'Handle with care. Bring to hazardous waste facility.' },
];

export const mockRouteStops = [
  { sys_id: 'rs-001', hauler: 'Cebu Green Haulers', hauler_id: 'haul-001', barangay: 'Lahug', stop_order: 1, estimated_arrival: '06:00', stop_status: 'Passed' },
  { sys_id: 'rs-002', hauler: 'Cebu Green Haulers', hauler_id: 'haul-001', barangay: 'Banilad', stop_order: 2, estimated_arrival: '07:00', stop_status: 'Passed' },
  { sys_id: 'rs-003', hauler: 'Cebu Green Haulers', hauler_id: 'haul-001', barangay: 'Mabolo', stop_order: 3, estimated_arrival: '08:00', stop_status: 'Current' },
  { sys_id: 'rs-004', hauler: 'Cebu Green Haulers', hauler_id: 'haul-001', barangay: 'Talamban', stop_order: 4, estimated_arrival: '09:00', stop_status: 'Not Arrived' },
  { sys_id: 'rs-005', hauler: 'Metro Waste Solutions', hauler_id: 'haul-002', barangay: 'Capitol Site', stop_order: 1, estimated_arrival: '06:00', stop_status: 'Passed' },
  { sys_id: 'rs-006', hauler: 'Metro Waste Solutions', hauler_id: 'haul-002', barangay: 'Labangon', stop_order: 2, estimated_arrival: '07:30', stop_status: 'Current' },
  { sys_id: 'rs-007', hauler: 'Metro Waste Solutions', hauler_id: 'haul-002', barangay: 'Guadalupe', stop_order: 3, estimated_arrival: '08:30', stop_status: 'Not Arrived' },
  { sys_id: 'rs-008', hauler: 'Metro Waste Solutions', hauler_id: 'haul-002', barangay: 'Tisa', stop_order: 4, estimated_arrival: '09:30', stop_status: 'Not Arrived' },
];
