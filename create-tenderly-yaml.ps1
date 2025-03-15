$content = @"
account_id: ""
actions:
  thebeej/ampli-project:
    runtime: v2
    sources: actions
    specs:
      usdc-monitor:
        description: Monitor USDC transfers to target wallet on Base chain
        function: usdc-monitor:monitorUSDCTransfers
        trigger:
          type: transaction
          transaction:
            status:
              - mined
            filters:
              - network: 8453  # Base chain
                to: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"  # USDC contract on Base
        execution_type: sequential
project_slug: ""
"@

Set-Content -Path tenderly.yaml -Value $content
Write-Host "tenderly.yaml created successfully" 