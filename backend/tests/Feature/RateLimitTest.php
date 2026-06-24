<?php

namespace Tests\Feature;

use Tests\TestCase;

class RateLimitTest extends TestCase
{
    public function test_api_requests_are_rate_limited_after_the_limit(): void
    {
        // The 'api' limiter allows 60/min; the 61st request should be blocked.
        for ($i = 0; $i < 60; $i++) {
            $this->getJson('/api/v1/health')->assertOk();
        }

        $this->getJson('/api/v1/health')
            ->assertStatus(429)
            ->assertJsonPath('error.code', 'too_many_requests');
    }
}
