<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Gate;
use Tests\TestCase;

class ApiConventionsTest extends TestCase
{
    public function test_health_endpoint_returns_the_success_envelope(): void
    {
        $this->getJson('/api/v1/health')
            ->assertOk()
            ->assertJsonStructure(['data', 'meta', 'error'])
            ->assertJson([
                'data' => ['status' => 'ok', 'service' => 'leanbox-api', 'version' => 'v1'],
                'meta' => null,
                'error' => null,
            ]);
    }

    public function test_unknown_api_route_returns_the_error_envelope(): void
    {
        $this->getJson('/api/v1/does-not-exist')
            ->assertNotFound()
            ->assertJsonStructure(['data', 'meta', 'error' => ['code', 'message']])
            ->assertJson([
                'data' => null,
                'meta' => null,
                'error' => ['code' => 'not_found'],
            ]);
    }

    public function test_protected_route_without_a_token_returns_the_401_error_envelope(): void
    {
        $this->getJson('/api/v1/user')
            ->assertUnauthorized()
            ->assertJson([
                'data' => null,
                'error' => ['code' => 'unauthenticated'],
            ]);
    }

    public function test_the_openapi_document_is_generated_and_reachable(): void
    {
        // Docs are gated outside the local environment; authorize a viewer for the test.
        Gate::define('viewApiDocs', fn ($user = null) => true);

        $response = $this->getJson('/docs/api.json')->assertOk();

        $this->assertNotNull($response->json('openapi'));
        $this->assertStringContainsString('health', json_encode($response->json('paths')));
    }
}
