<?php
declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

use App\Core\Config;
use App\Core\Database;
use App\Middleware\AuthMiddleware;
use App\Routes\AuthRoutes;
use App\Routes\StudentRoutes;
use App\Routes\AllRoutes;
use Slim\Factory\AppFactory;

// Bootstrap
$config = Config::getInstance();

// Create tables on first run
Database::createTables();

$app = AppFactory::create();
$app->addBodyParsingMiddleware();
$app->addRoutingMiddleware();

// Global auth middleware (populates user attribute — routes decide if auth is required)
$app->add(new AuthMiddleware());

// CORS — match the incoming Origin against the allowed list
$app->add(function ($request, $handler) use ($config) {
    $allowedList = array_map('trim', explode(',', $config->get('allowed_origins', '*')));
    $requestOrigin = $request->getHeaderLine('Origin');
    $origin = in_array($requestOrigin, $allowedList, true) ? $requestOrigin : ($allowedList[0] ?? '*');

    if ($request->getMethod() === 'OPTIONS') {
        $response = new \Slim\Psr7\Response();
        return $response
            ->withHeader('Access-Control-Allow-Origin', $origin)
            ->withHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization')
            ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
            ->withHeader('Access-Control-Allow-Credentials', 'true')
            ->withStatus(200);
    }

    $response = $handler->handle($request);
    return $response
        ->withHeader('Access-Control-Allow-Origin', $origin)
        ->withHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization')
        ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
        ->withHeader('Access-Control-Allow-Credentials', 'true');
});

$app->addErrorMiddleware(
    $config->get('environment') !== 'production',
    true,
    true
);

// Root routes
$app->get('/', function ($request, $response) {
    $response->getBody()->write(json_encode([
        'message' => 'Campus Reminder System API',
        'version' => '1.0.0',
    ]));
    return $response->withHeader('Content-Type', 'application/json');
});

$app->get('/health', function ($request, $response) {
    $response->getBody()->write(json_encode(['status' => 'ok']));
    return $response->withHeader('Content-Type', 'application/json');
});

// Register all route groups
AuthRoutes::register($app);
StudentRoutes::register($app);
AllRoutes::register($app);

$app->run();
