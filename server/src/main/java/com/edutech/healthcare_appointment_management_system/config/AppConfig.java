

package com.edutech.healthcare_appointment_management_system.config;
 
import org.springframework.context.annotation.Bean;

import org.springframework.context.annotation.Configuration;

import org.springframework.scheduling.annotation.EnableAsync;

import org.springframework.scheduling.annotation.EnableScheduling;

import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
 
import java.util.concurrent.Executor;
 
 
@Configuration

@EnableAsync

@EnableScheduling  // ✅ ADD THIS for appointment reminders

public class AppConfig {

    @Bean(name = "emailTaskExecutor")

    public Executor emailTaskExecutor() {

        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();

        executor.setCorePoolSize(2);

        executor.setMaxPoolSize(4);

        executor.setQueueCapacity(100);

        executor.setThreadNamePrefix("email-");

        executor.initialize();

        return executor;

    }

}

 