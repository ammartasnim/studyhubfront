# Backend Connection Troubleshooting Guide

## Error: `net::ERR_CONNECTION_REFUSED` (Error Code: 0)

This error means the frontend **cannot reach the backend server** at `http://localhost:8081`.

## Diagnosis Checklist

### 1. Is the Backend Running?
```bash
# Check if backend is listening on port 8081
# Windows PowerShell:
netstat -ano | findstr :8081

# If running, you should see something like:
# TCP    127.0.0.1:8081    LISTENING    12345
```

**If NOT running**: Start your backend server first!

### 2. Is Port 8081 Correct?
```bash
# Check what ports are in use
netstat -ano | findstr LISTENING

# If backend is on different port, update:
# src/app/api/auth.service.ts:27
private baseUrl = 'http://localhost:8081/api/auth';  // ← Change 8081 here
```

### 3. Firewall/Network Issues?
- Check Windows Firewall: Allow port 8081
- Check antivirus software: May be blocking connection
- Check Network: Ensure connectivity to localhost

### 4. Backend URL Configuration
```typescript
// Check current backend URL in auth.service.ts
private baseUrl = 'http://localhost:8081/api/auth';

// Common misconfigurations:
// ❌ 'http://localhost:8080/api/auth'     (wrong port)
// ❌ 'http://127.0.0.1:8081/api/auth'     (should work but uncommon)
// ❌ 'http://backend:8081/api/auth'       (doesn't resolve)
// ✅ 'http://localhost:8081/api/auth'     (correct)
```

## Console Logs for Debugging

After the improvement, you'll see detailed logs:

```
[AuthService] Login attempt: {email: "user@example.com", url: "http://localhost:8081/api/auth/login"}
[AuthService] UNKNOWN_ERROR failed: {
  errorType: "BACKEND_UNREACHABLE"
  errorMessage: "Unable to connect to backend server at http://localhost:8081..."
  errorDetails: {
    status: 0
    statusText: ""
    baseUrl: "http://localhost:8081/api/auth"
    hint: "net::ERR_CONNECTION_REFUSED usually means backend is down or port is wrong"
  }
}
```

## Solutions

### Solution 1: Start the Backend Server
Make sure your Java/Spring Boot backend is running:
```bash
# Navigate to backend project
cd Project_dintegration/studyhubback  # Or wherever your backend is

# Run the backend (Spring Boot)
mvn spring-boot:run

# Or if using Gradle:
./gradlew bootRun

# Or if jar file exists:
java -jar studyhub-backend.jar
```

The backend should output something like:
```
Started [YourAppName] in [X.XXX] seconds
Tomcat started on port(s): 8081
```

### Solution 2: Update Backend URL if Port is Different
If your backend runs on a different port:

```typescript
// src/app/api/auth.service.ts:27

// Change from:
private baseUrl = 'http://localhost:8081/api/auth';

// To (example if backend is on 3000):
private baseUrl = 'http://localhost:3000/api/auth';
```

Then rebuild:
```bash
npm run build
npm start
```

### Solution 3: Check Backend Connectivity
Use the improved health check:

```typescript
// In login.component.ts or any component
constructor(private authService: AuthService) {}

ngOnInit() {
  this.authService.checkBackendHealth().subscribe({
    next: () => console.log('Backend is reachable!'),
    error: (err) => console.error('Backend unreachable:', err.message)
  });
}
```

### Solution 4: Enable CORS on Backend (if needed)
If you get CORS errors after the connection works, backend needs:

```java
// Spring Boot example
@Configuration
public class CorsConfig {
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                    .allowedOrigins("http://localhost:4200")  // Frontend URL
                    .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                    .allowedHeaders("*")
                    .allowCredentials(true);
            }
        };
    }
}
```

## Testing the Connection

### Step 1: Test Backend Directly
Open browser and visit:
```
http://localhost:8081/api/auth/health
```

Should return:
- ✅ HTTP 200 (backend is running)
- ❌ Connection refused (backend is down)
- ❌ HTTP 404 (endpoint doesn't exist)

### Step 2: Test from Frontend
In browser DevTools Console:
```javascript
// Test connection
fetch('http://localhost:8081/api/auth/health')
  .then(r => console.log('Connected:', r.status))
  .catch(e => console.error('Cannot connect:', e.message));
```

### Step 3: Check Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Try to login
4. Click on the failed request
5. Check:
   - **URL**: Is it correct?
   - **Status**: What's the status code?
   - **Response**: Any error message?

## Improved Error Messages

The auth service now provides helpful error messages:

### Backend Unreachable
```
Unable to connect to backend server at http://localhost:8081. 

Please ensure:
1. Backend server is running
2. Backend is listening on http://localhost:8081
3. No firewall is blocking the connection
4. Network connectivity is available

Technical: net::ERR_CONNECTION_REFUSED
```

### Invalid Credentials
```
Invalid email or password
```

### Server Error
```
Server error occurred: [error details]
```

### Endpoint Not Found
```
Backend endpoint not found: http://localhost:8081/api/auth/login
```

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| `ERR_CONNECTION_REFUSED` | Start backend server, check port |
| `ERR_NAME_NOT_RESOLVED` | Check hostname (localhost vs 127.0.0.1) |
| CORS error | Add CORS config to backend |
| 404 Not Found | Check API endpoint path |
| 401 Unauthorized | Check credentials or token |
| 500 Server Error | Check backend logs |
| Timeout | Backend is slow or hung, restart it |

## Quick Restart Checklist

When login stops working suddenly:

1. ✅ Check if backend process is still running
   ```bash
   netstat -ano | findstr :8081
   ```

2. ✅ Check backend logs for errors
   ```bash
   # Look at Spring Boot startup logs
   # Check for any exceptions
   ```

3. ✅ Restart the backend
   ```bash
   # Kill and restart
   # Or use: Ctrl+C then re-run command
   ```

4. ✅ Clear frontend cache
   ```bash
   # In browser: Ctrl+Shift+Delete
   # Or npm start with --poll flag
   ```

5. ✅ Check firewall/antivirus
   - Windows Defender may have blocked port
   - Antivirus may be interfering

6. ✅ If still failing
   - Check error message in browser console
   - Read the detailed error logs
   - Check backend log files

## Monitoring Backend Health

You can add a health check to your dashboard:

```typescript
// health-check.component.ts
import { Component, OnInit } from '@angular/core';
import { AuthService } from './api/auth.service';

@Component({
  selector: 'app-health-check',
  template: `
    <div>
      Backend Status: 
      <span [class]="backendStatus === 'online' ? 'text-green-500' : 'text-red-500'">
        {{ backendStatus }}
      </span>
    </div>
  `
})
export class HealthCheckComponent implements OnInit {
  backendStatus = 'checking...';

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.checkHealth();
    // Check every 30 seconds
    setInterval(() => this.checkHealth(), 30000);
  }

  checkHealth() {
    this.authService.checkBackendHealth().subscribe({
      next: () => this.backendStatus = 'online',
      error: () => this.backendStatus = 'offline'
    });
  }
}
```

## Need More Help?

Check:
1. Backend console logs - what's happening on server side?
2. Browser DevTools Network tab - exact error details
3. Backend firewall rules - is port 8081 allowed?
4. Backend configuration - is it actually listening on 8081?
