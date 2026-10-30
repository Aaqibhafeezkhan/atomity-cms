package io.atomity.generalcms.shared;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Tags every request with a correlation ID: the caller's {@code X-Correlation-ID}
 * when it looks sane, otherwise a fresh UUID. The ID goes into the MDC (so it
 * appears on every log line), back on the response header, and into error bodies.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorrelationFilter extends OncePerRequestFilter {

    public static final String CORRELATION_HEADER = "X-Correlation-ID";
    public static final String MDC_CORRELATION_KEY = "correlation_id";

    // Caller-supplied IDs are echoed into logs; restrict them so a client
    // cannot inject newlines or arbitrarily long strings into log output.
    private static final Pattern SAFE_ID = Pattern.compile("[A-Za-z0-9._-]{1,64}");

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String incoming = request.getHeader(CORRELATION_HEADER);
        String correlationId = incoming != null && SAFE_ID.matcher(incoming).matches()
                ? incoming
                : UUID.randomUUID().toString();

        MDC.put(MDC_CORRELATION_KEY, correlationId);
        response.setHeader(CORRELATION_HEADER, correlationId);
        try {
            chain.doFilter(request, response);
        } finally {
            MDC.remove(MDC_CORRELATION_KEY);
        }
    }
}
