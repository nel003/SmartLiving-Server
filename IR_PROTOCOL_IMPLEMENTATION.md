# IR Protocol Implementation for SmartLiving

## 🎯 Overview

Added comprehensive IR protocol support to the SmartLiving system, allowing users to specify the IR protocol when creating IR buttons for better device compatibility.

## 🔧 Changes Made

### Frontend (React Native)

#### 1. Updated IRCommand Interface
```typescript
interface IRCommand {
    id: number;
    label: string;
    command: string;
    protocol: string;  // NEW: IR protocol field
    icon: string;
    color: string;
    created_at?: string;
}
```

#### 2. Added Protocol Selection
- **Available Protocols**: NEC, RC5, RC6, Sony, Panasonic, JVC, Samsung, LG, Sharp, Mitsubishi, Sanyo, Pioneer, Denon, Onkyo, Yamaha, Custom
- **Default Protocol**: NEC (most common)
- **UI Component**: Select dropdown in the IR button creation dialog

#### 3. Updated WebSocket Messages
```typescript
// IR command now includes protocol
{
    type: "ir_command",
    pin: devicePin,
    command: command.command,
    protocol: command.protocol,  // NEW: Protocol field
    for: roomName,
    mac: deviceMac,
    device_type: deviceType
}
```

### Backend (Node.js)

#### 1. Database Schema Update
```sql
-- Add protocol column to ir_buttons table
ALTER TABLE ir_buttons 
ADD COLUMN protocol VARCHAR(50) NOT NULL DEFAULT 'NEC' 
AFTER command;

-- Add index for better performance
CREATE INDEX idx_ir_buttons_protocol ON ir_buttons(protocol);
```

#### 2. API Validation
- **Input Validation**: Protocol field is required and must be one of the supported protocols
- **Database Queries**: Updated to include protocol field in INSERT and SELECT operations
- **Error Handling**: Proper validation messages for invalid protocols

#### 3. WebSocket Validation
- **Message Validation**: IR commands must include a valid protocol
- **Protocol Support**: Validates against the list of supported IR protocols

## 📋 Supported IR Protocols

| Protocol | Description | Common Use |
|----------|-------------|------------|
| **NEC** | Most common protocol | TVs, Set-top boxes, Air conditioners |
| **RC5** | Philips protocol | Philips devices, some TVs |
| **RC6** | Enhanced RC5 | Philips devices, some media players |
| **Sony** | Sony SIRC protocol | Sony TVs, DVD players, game consoles |
| **Panasonic** | Panasonic protocol | Panasonic TVs, air conditioners |
| **JVC** | JVC protocol | JVC TVs, DVD players |
| **Samsung** | Samsung protocol | Samsung TVs, Blu-ray players |
| **LG** | LG protocol | LG TVs, air conditioners |
| **Sharp** | Sharp protocol | Sharp TVs, air conditioners |
| **Mitsubishi** | Mitsubishi protocol | Mitsubishi air conditioners, projectors |
| **Sanyo** | Sanyo protocol | Sanyo TVs, air conditioners |
| **Pioneer** | Pioneer protocol | Pioneer audio/video equipment |
| **Denon** | Denon protocol | Denon audio equipment |
| **Onkyo** | Onkyo protocol | Onkyo audio equipment |
| **Yamaha** | Yamaha protocol | Yamaha audio equipment |
| **Custom** | Custom protocol | Custom or unknown devices |

## 🚀 Usage

### Creating IR Buttons with Protocol

1. **Open IR Device Page**: Navigate to an IR device
2. **Add New Button**: Tap the "+" button
3. **Fill Required Fields**:
   - Label (e.g., "Power On")
   - Command (e.g., "0xFF00FF00")
   - **Protocol** (e.g., "NEC") - NEW!
   - Icon
   - Color
4. **Save**: The button is created with protocol information

### Sending IR Commands

When an IR button is pressed, the system sends:
```json
{
    "type": "ir_command",
    "pin": 12,
    "command": "0xFF00FF00",
    "protocol": "NEC",
    "for": "Living Room",
    "mac": "AA:BB:CC:DD:EE:FF",
    "device_type": "ir"
}
```

## 🔧 Database Migration

Run the migration script to add protocol support to existing installations:

```bash
mysql -u root -p smartliving < add_protocol_to_ir_buttons.sql
```

This will:
- Add the `protocol` column to the `ir_buttons` table
- Set default protocol to 'NEC' for existing records
- Add an index for better query performance

## 🎯 Benefits

1. **Better Device Compatibility**: Different devices use different IR protocols
2. **Improved Accuracy**: Correct protocol ensures commands are sent properly
3. **User Education**: Users learn about IR protocols and device compatibility
4. **Future-Proof**: Easy to add new protocols as needed
5. **Debugging**: Protocol information helps troubleshoot IR issues

## 🔍 Troubleshooting

### Common Issues

1. **Command Not Working**
   - Check if the correct protocol is selected
   - Try different protocols (NEC is most common)
   - Verify the command code is correct

2. **Protocol Not Available**
   - Use "Custom" for unknown protocols
   - Contact support to add new protocols

3. **Database Errors**
   - Ensure migration script was run
   - Check that protocol column exists

## 📚 Technical Details

### Protocol Validation
```typescript
protocol: Joi.string()
    .valid('NEC', 'RC5', 'RC6', 'Sony', 'Panasonic', 'JVC', 'Samsung', 'LG', 'Sharp', 'Mitsubishi', 'Sanyo', 'Pioneer', 'Denon', 'Onkyo', 'Yamaha', 'Custom')
    .required()
```

### Database Schema
```sql
CREATE TABLE ir_buttons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id INT NOT NULL,
    label VARCHAR(255) NOT NULL,
    command TEXT NOT NULL,
    protocol VARCHAR(50) NOT NULL DEFAULT 'NEC',  -- NEW
    icon VARCHAR(255) NOT NULL,
    color VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
    INDEX idx_device_id (device_id),
    INDEX idx_protocol (protocol),  -- NEW
    INDEX idx_created_at (created_at)
);
```

## 🎉 Result

The SmartLiving system now supports comprehensive IR protocol management, making it more compatible with a wide range of IR-controlled devices and providing users with better control over their smart home setup.
