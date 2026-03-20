import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function TerminalLocalTime({ timezone }) {
  const [localTime, setLocalTime] = useState('');
  const [is12Hour, setIs12Hour] = useState(false);

  useEffect(() => {
    // Load user preference for time format if available
    const loadPreference = async () => {
      try {
        const { base44 } = await import('@/api/base44Client');
        const user = await base44.auth.me();
        const prefs = await base44.entities.UserPreference.filter({ userId: user.id });
        if (prefs[0]?.timeFormat === '12H') {
          setIs12Hour(true);
        }
      } catch (e) {
        // User not logged in or no preference, default to 24H
      }
    };
    loadPreference();
  }, []);

  useEffect(() => {
    if (!timezone) return;

    const updateTime = () => {
      const now = new Date();
      
      try {
        // Try to use timezone directly with Intl (for IANA format like "Asia/Dubai")
        const options = {
          timeZone: timezone,
          hour: '2-digit',
          minute: '2-digit',
          hour12: is12Hour
        };
        
        const formatter = new Intl.DateTimeFormat('en-US', options);
        const formatted = formatter.format(now);
        
        setLocalTime(formatted);
      } catch (error) {
        // If timezone is not valid IANA format, try to parse UTC offset (e.g., "UTC+4", "GMT+3")
        const offsetMatch = timezone.match(/UTC([+-]\d+)|GMT([+-]\d+)|([+-]\d+)/);
        
        if (offsetMatch) {
          const offset = parseInt(offsetMatch[1] || offsetMatch[2] || offsetMatch[3]);
          
          // Get current UTC time
          const utcHours = now.getUTCHours();
          const utcMinutes = now.getUTCMinutes();
          
          // Apply offset to get terminal local time
          let hours = utcHours + offset;
          let minutes = utcMinutes;
          
          // Handle day overflow
          if (hours >= 24) hours -= 24;
          if (hours < 0) hours += 24;
          
          let formatted;
          if (is12Hour) {
            const period = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours % 12 || 12;
            formatted = `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
          } else {
            formatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          }
          
          setLocalTime(formatted);
        } else {
          setLocalTime('Invalid timezone');
        }
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [timezone, is12Hour]);

  if (!timezone) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Clock className="w-4 h-4" />
        <span>Time zone not configured</span>
      </div>
    );
  }

  if (!localTime || localTime === 'Invalid timezone') {
    return (
      <div className="flex items-center gap-2 text-sm text-amber-600">
        <Clock className="w-4 h-4" />
        <span>Time zone not configured</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Clock className="w-4 h-4 text-cyan-600" />
      <div>
        <span className="text-gray-900 font-medium">{localTime}</span>
        <span className="text-xs text-gray-500 ml-2">(Local Time)</span>
      </div>
    </div>
  );
}