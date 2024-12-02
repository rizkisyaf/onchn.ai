#[macro_use] extern crate rocket;

use rocket::serde::json::Json;
use serde::{Deserialize, Serialize};
use reqwest;

#[derive(Serialize, Deserialize)]
struct WalletData {
    address: String,
    balance: f64,
    transactions: Vec<String>,
}

#[get("/wallet/<address>")]
async fn get_wallet_data(address: String) -> Json<WalletData> {
    // In a real application, you would fetch this data from SolanaTracker.io
    // For now, we'll return mock data
    let wallet_data = WalletData {
        address,
        balance: 100.0,
        transactions: vec!["tx1".to_string(), "tx2".to_string()],
    };

    Json(wallet_data)
}

#[launch]
fn rocket() -> _ {
    rocket::build().mount("/api", routes![get_wallet_data])
}

