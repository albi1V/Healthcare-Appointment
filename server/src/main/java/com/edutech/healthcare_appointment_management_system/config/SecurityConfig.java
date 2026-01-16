package com.edutech.healthcare_appointment_management_system.config;
 
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.context.annotation.Bean;

import org.springframework.context.annotation.Configuration;

import org.springframework.http.HttpMethod;

import org.springframework.security.authentication.AuthenticationManager;

import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;

import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;

import org.springframework.security.config.annotation.web.builders.HttpSecurity;

import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;

import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;

import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.security.core.userdetails.UserDetailsService;

import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
 
import com.edutech.healthcare_appointment_management_system.jwt.JwtRequestFilter;
 
@Configuration

@EnableWebSecurity

@EnableGlobalMethodSecurity(prePostEnabled = true)

public class SecurityConfig extends WebSecurityConfigurerAdapter {
 
    private final UserDetailsService userDetailsService;

    private final JwtRequestFilter jwtRequestFilter;

    private final PasswordEncoder passwordEncoder;
 
    @Autowired

    public SecurityConfig(UserDetailsService userDetailsService,
                          JwtRequestFilter jwtRequestFilter,
                          PasswordEncoder passwordEncoder) {
        this.userDetailsService = userDetailsService;
        this.jwtRequestFilter = jwtRequestFilter;
        this.passwordEncoder = passwordEncoder;

    }
 
    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
        auth.userDetailsService(userDetailsService).passwordEncoder(passwordEncoder);
    }
 
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        // IMPORTANT: list all public endpoints FIRST, then call anyRequest().authenticated()

        http.cors().and().csrf().disable()

            .authorizeRequests()

            // public endpoints (allow unauthenticated requests)

            .antMatchers(

                "/api/user/login",

                "/api/user/verify-otp",

                "/api/user/resend-otp",

                "/api/patient/register",

                "/api/doctors/register",

                "/api/receptionist/register",

                 "/api/news",

                 "/api/doctor/profile"

 
            ).permitAll()

            // role-based endpoints

            .antMatchers(HttpMethod.GET,"/receptionist/dashboard-data").hasAuthority("RECEPTIONIST")

            .antMatchers(HttpMethod.POST, "/api/doctor/availability").hasAuthority("DOCTOR")

            .antMatchers(HttpMethod.POST, "/api/patient/appointment").hasAuthority("PATIENT")

            .antMatchers(HttpMethod.POST, "/api/receptionist/appointment").hasAuthority("RECEPTIONIST")

            .antMatchers(HttpMethod.GET, "/api/patient/doctors").hasAnyAuthority("PATIENT")
 
            .antMatchers(HttpMethod.GET, "/api/patient/appointments").hasAuthority("PATIENT")

            .antMatchers(HttpMethod.GET, "/api/patient/medicalrecords").hasAuthority("PATIENT")

            .antMatchers(HttpMethod.GET, "/api/doctor/appointments").hasAuthority("DOCTOR")

            .antMatchers(HttpMethod.GET, "/api/receptionist/appointments").hasAuthority("RECEPTIONIST")

            .antMatchers(HttpMethod.PUT, "/api/receptionist/appointment-reschedule/**").hasAuthority("RECEPTIONIST")
 
            // everything else requires authentication

            .anyRequest().authenticated()

            .and()

            .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS);
 
        // JWT filter must be before UsernamePasswordAuthenticationFilter

        http.addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class);

    }
 
    @Bean

    @Override

    public AuthenticationManager authenticationManagerBean() throws Exception {

        return super.authenticationManagerBean();

    }

}
 