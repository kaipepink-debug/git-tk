
UPDATE gateway_settings 
SET api_token = (SELECT api_token FROM gateway_settings WHERE gateway_name = 'SigmaPay'),
    product_id = (SELECT product_id FROM gateway_settings WHERE gateway_name = 'SigmaPay'),
    is_active = true,
    updated_at = now()
WHERE gateway_name = 'PayEvo';

UPDATE gateway_settings 
SET is_active = false,
    api_token = '',
    product_id = '',
    updated_at = now()
WHERE gateway_name = 'SigmaPay';
