-- SmartLiving Database Performance Optimization
-- Add indexes for frequently queried columns

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Home keys table indexes
CREATE INDEX IF NOT EXISTS idx_home_keys_user_id ON home_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_home_keys_value ON home_keys(value);

-- Rooms table indexes
CREATE INDEX IF NOT EXISTS idx_rooms_home_id ON rooms(home_id);
CREATE INDEX IF NOT EXISTS idx_rooms_mac ON rooms(mac);
CREATE INDEX IF NOT EXISTS idx_rooms_name ON rooms(name);

-- Devices table indexes
CREATE INDEX IF NOT EXISTS idx_devices_room_id ON devices(room_id);
CREATE INDEX IF NOT EXISTS idx_devices_device_mac ON devices(device_mac);
CREATE INDEX IF NOT EXISTS idx_devices_type ON devices(type);
CREATE INDEX IF NOT EXISTS idx_devices_pin ON devices(pin);

-- IR buttons table indexes
CREATE INDEX IF NOT EXISTS idx_ir_buttons_device_id ON ir_buttons(device_id);
CREATE INDEX IF NOT EXISTS idx_ir_buttons_created_at ON ir_buttons(created_at);

-- Push notification tokens table indexes
CREATE INDEX IF NOT EXISTS idx_push_notif_token_user_id ON push_notif_token(user_id);
CREATE INDEX IF NOT EXISTS idx_push_notif_token_token ON push_notif_token(token);
CREATE INDEX IF NOT EXISTS idx_push_notif_token_created_at ON push_notif_token(created_at);

-- Refresh tokens table indexes
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_created_at ON refresh_tokens(created_at);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_rooms_home_id_mac ON rooms(home_id, mac);
CREATE INDEX IF NOT EXISTS idx_devices_room_id_type ON devices(room_id, type);
CREATE INDEX IF NOT EXISTS idx_home_keys_user_id_value ON home_keys(user_id, value);

-- Analyze tables to update statistics
ANALYZE TABLE users;
ANALYZE TABLE home_keys;
ANALYZE TABLE rooms;
ANALYZE TABLE devices;
ANALYZE TABLE ir_buttons;
ANALYZE TABLE push_notif_token;
ANALYZE TABLE refresh_tokens;
