-- Create push_notif_token table for storing user push notification tokens
CREATE TABLE IF NOT EXISTS push_notif_token (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(500) NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_token (user_id, token),
    INDEX idx_user_id (user_id),
    INDEX idx_token (token)
);

-- Add comment to describe the table purpose
ALTER TABLE push_notif_token COMMENT = 'Stores push notification tokens for users';
