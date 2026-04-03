package com.mapplify.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

/**
 * Global CORS filter that runs BEFORE any other filter.
 * This ensures preflight OPTIONS requests are always handled correctly,
 * even if other filters (e.g. Spring Security) would block them.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorsFilter implements Filter {

    @Value("${mapplify.allowed.origins:http://localhost:*,http://127.0.0.1:*}")
    private String allowedOriginsConfig;

    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {

        HttpServletResponse response = (HttpServletResponse) res;
        HttpServletRequest request = (HttpServletRequest) req;

        String origin = request.getHeader("Origin");

        if (origin != null && isOriginAllowed(origin)) {
            response.setHeader("Access-Control-Allow-Origin", origin);
            response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
            response.setHeader("Access-Control-Allow-Credentials", "true");
            response.setHeader("Access-Control-Max-Age", "3600");
        }

        // Short-circuit preflight requests
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatus(HttpServletResponse.SC_OK);
            return;
        }

        chain.doFilter(req, res);
    }

    private boolean isOriginAllowed(String origin) {
        List<String> patterns = Arrays.stream(allowedOriginsConfig.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();

        for (String pattern : patterns) {
            if (matchOriginPattern(origin, pattern)) {
                return true;
            }
        }
        return false;
    }

    private boolean matchOriginPattern(String origin, String pattern) {
        // Exact match
        if (pattern.equals(origin)) return true;

        // Wildcard pattern: e.g. "http://localhost:*"
        if (pattern.contains("*")) {
            String regex = pattern
                    .replace(".", "\\.")
                    .replace("*", ".*");
            return origin.matches(regex);
        }

        return false;
    }
}
