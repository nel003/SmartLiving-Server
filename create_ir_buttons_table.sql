-- Create ir_buttons table for storing IR device button configurations
CREATE TABLE IF NOT EXISTS ir_buttons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id INT NOT NULL,
    label VARCHAR(255) NOT NULL,
    command TEXT NOT NULL,
    icon VARCHAR(255) NOT NULL,
    color VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
    INDEX idx_device_id (device_id),
    INDEX idx_created_at (created_at)
);

-- Add comment to describe the table purpose
ALTER TABLE ir_buttons COMMENT = 'Stores IR button configurations for IR devices';
