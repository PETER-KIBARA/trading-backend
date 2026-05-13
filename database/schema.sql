-- Trading Platform Database Schema
-- PostgreSQL schema for AI-powered trading platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    profile_image VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    kyc_status VARCHAR(50),
    kyc_documents TEXT,
    preferences JSONB DEFAULT '{}',
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Deriv accounts table
CREATE TABLE IF NOT EXISTS deriv_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id VARCHAR(255) UNIQUE NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(100) NOT NULL,
    encrypted_token VARCHAR(255),
    currency VARCHAR(20),
    balance DECIMAL(15,2) DEFAULT 0,
    trading_experience VARCHAR(50),
    settings JSONB DEFAULT '{}',
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_synced_at TIMESTAMP,
    connection_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bots table
CREATE TABLE IF NOT EXISTS bots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    deriv_account_id UUID NOT NULL REFERENCES deriv_accounts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'inactive',
    strategy_type VARCHAR(100) NOT NULL,
    strategy_config JSONB NOT NULL,
    market_type VARCHAR(100) NOT NULL,
    symbol VARCHAR(100),
    initial_stake DECIMAL(10,2) NOT NULL,
    max_daily_loss DECIMAL(10,2) NOT NULL,
    max_consecutive_loss DECIMAL(10,2) NOT NULL,
    consecutive_losses INTEGER DEFAULT 0,
    total_profit DECIMAL(15,2) DEFAULT 0,
    total_trades DECIMAL(15,2) DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0,
    is_paper_trading_mode BOOLEAN DEFAULT FALSE,
    is_auto_restart BOOLEAN DEFAULT TRUE,
    max_run_time_minutes INTEGER DEFAULT 5,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    risk_settings JSONB DEFAULT '{}',
    logs TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trades table
CREATE TABLE IF NOT EXISTS trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deriv_account_id UUID NOT NULL REFERENCES deriv_accounts(id) ON DELETE CASCADE,
    contract_id VARCHAR(255) UNIQUE NOT NULL,
    market_type VARCHAR(100) NOT NULL,
    symbol VARCHAR(100),
    contract_type VARCHAR(50) NOT NULL,
    stake DECIMAL(10,2) NOT NULL,
    trade_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'open',
    entry_price DECIMAL(10,2),
    exit_price DECIMAL(10,2),
    profit DECIMAL(10,2),
    profit_percentage DECIMAL(5,2),
    duration_minutes INTEGER,
    open_time TIMESTAMP NOT NULL,
    close_time TIMESTAMP,
    metadata JSONB,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_type VARCHAR(50) NOT NULL,
    monthly_price DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    stripe_subscription_id VARCHAR(255),
    mpesa_transaction_id VARCHAR(255),
    max_bots INTEGER DEFAULT 0,
    max_live_accounts INTEGER DEFAULT 0,
    has_ai_features BOOLEAN DEFAULT FALSE,
    has_telegram_integration BOOLEAN DEFAULT FALSE,
    back_testing_credits INTEGER DEFAULT 0,
    feature_access JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(20) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(255),
    transaction_id VARCHAR(255),
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    priority VARCHAR(50),
    data JSONB,
    sent_to_telegram BOOLEAN DEFAULT FALSE,
    sent_to_email BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Risk settings table
CREATE TABLE IF NOT EXISTS risk_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    max_daily_loss DECIMAL(10,2) NOT NULL,
    max_consecutive_losses DECIMAL(10,2) NOT NULL,
    max_stake DECIMAL(10,2) NOT NULL,
    min_stake DECIMAL(10,2) NOT NULL,
    stop_loss_percentage DECIMAL(5,2) NOT NULL,
    take_profit_percentage DECIMAL(5,2) NOT NULL,
    max_trades_per_day INTEGER NOT NULL,
    session_timeout_minutes INTEGER,
    max_drawdown_percentage DECIMAL(5,2) NOT NULL,
    enable_stop_loss BOOLEAN DEFAULT TRUE,
    enable_take_profit BOOLEAN DEFAULT TRUE,
    custom_rules JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Strategy configs table
CREATE TABLE IF NOT EXISTS strategy_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    strategy_type VARCHAR(100) NOT NULL,
    description TEXT,
    parameters JSONB NOT NULL,
    back_test_results JSONB,
    is_public BOOLEAN DEFAULT FALSE,
    average_win_rate DECIMAL(5,2) DEFAULT 0,
    total_backtests INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analytics logs table
CREATE TABLE IF NOT EXISTS analytics_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255),
    event_type VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    metadata JSONB,
    status VARCHAR(50),
    error_message TEXT,
    ip_address VARCHAR(50),
    user_agent VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_deriv_accounts_user_id ON deriv_accounts(user_id);
CREATE INDEX idx_bots_user_id ON bots(user_id);
CREATE INDEX idx_bots_status ON bots(status);
CREATE INDEX idx_trades_account_id ON trades(deriv_account_id);
CREATE INDEX idx_trades_open_time ON trades(open_time);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_analytics_logs_user_id ON analytics_logs(user_id);
CREATE INDEX idx_analytics_logs_created_at ON analytics_logs(created_at);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deriv_accounts_updated_at BEFORE UPDATE ON deriv_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bots_updated_at BEFORE UPDATE ON bots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON trades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_risk_settings_updated_at BEFORE UPDATE ON risk_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_strategy_configs_updated_at BEFORE UPDATE ON strategy_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
