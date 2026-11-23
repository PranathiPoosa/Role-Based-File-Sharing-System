package com.rbfs.interceptors;

import com.rbfs.security.UserDetailsImpl;
import com.rbfs.services.AuditService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AuditLogInterceptor implements HandlerInterceptor {

    private static final Logger logger = LoggerFactory.getLogger(AuditLogInterceptor.class);

    @Autowired
    private AuditService auditService;

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        try {
            String method = request.getMethod();
            String uri = request.getRequestURI();

            // Skip static or pre-flight OPTIONS requests
            if ("OPTIONS".equalsIgnoreCase(method)) {
                return;
            }

            // Only audit state-changing or critical download/auth requests
            boolean isAuditable = "POST".equalsIgnoreCase(method) 
                    || "PUT".equalsIgnoreCase(method) 
                    || "PATCH".equalsIgnoreCase(method) 
                    || "DELETE".equalsIgnoreCase(method)
                    || uri.contains("/download");

            if (!isAuditable) {
                return;
            }

            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String userId = "anonymous";
            String userEmail = "anonymous";

            if (auth != null && auth.getPrincipal() instanceof UserDetailsImpl) {
                UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
                userId = userDetails.getId();
                userEmail = userDetails.getEmail();
            }

            int status = response.getStatus();
            String statusStr = (status >= 200 && status < 400 && ex == null) ? "SUCCESS" : "FAILURE";

            String action = method + " " + uri;
            String resourceType = uri.contains("/files") ? "FILE" : uri.contains("/folders") ? "FOLDER" : uri.contains("/users") ? "USER" : "API";

            auditService.log(
                    userId,
                    userEmail,
                    action,
                    uri,
                    resourceType,
                    "HTTP Status: " + status + (ex != null ? " Exception: " + ex.getMessage() : ""),
                    request.getRemoteAddr(),
                    statusStr
            );
        } catch (Exception e) {
            logger.error("AuditLogInterceptor error: {}", e.getMessage());
        }
    }
}
