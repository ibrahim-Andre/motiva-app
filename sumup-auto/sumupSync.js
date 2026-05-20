require("dotenv").config();

const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");

// ENV
const SUPABASE_URL =
  process.env.REACT_APP_SUPABASE_URL ||
  process.env.SUPABASE_URL;

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE ||
  process.env.REACT_APP_SUPABASE_ANON_KEY;

const SUMUP_API_KEY =
  process.env.SUMUP_API_KEY;

// SUPABASE
const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

async function syncSumupTransactions() {

  try {

    console.log(
      "🚀 SumUp sync başlıyor..."
    );

    let allTransactions = [];
    let nextCursor = null;

    // TÜM TRANSACTIONS
    do {

      const response = await axios.get(
        "https://api.sumup.com/v0.1/me/transactions/history",
        {
          headers: {
            Authorization:
              `Bearer ${SUMUP_API_KEY}`,
          },

          params: {
            limit: 100,
            cursor: nextCursor,
            order: "descending",
          },
        }
      );

      const items =
        response.data.items || [];

      console.log(
        "📦 batch:",
        items.length
      );

      allTransactions.push(...items);

      nextCursor =
        response.data.cursor || null;

    } while (nextCursor);

    console.log(
      "📊 toplam:",
      allTransactions.length
    );

    // SADECE BAŞARILI
    const transactions =
      allTransactions.filter(
        (tx) =>
          tx.status === "SUCCESSFUL" ||
          tx.status === "PAID"
      );

    console.log(
      "✅ başarılı:",
      transactions.length
    );

    for (const tx of transactions) {

      const amount =
        Number(tx.amount || 0);

      const fee =
        Number(tx.fee || 0);

      const transactionId =
        tx.transaction_id || tx.id;

      const txDate =
        new Date(tx.timestamp)
          .toISOString()
          .split("T")[0];

      // DRIVER BUL
      let driverId = null;

      const sumupUser =
        tx.user
          ?.toString()
          .trim()
          .toLowerCase();

      console.log(
        "SUMUP USER:",
        sumupUser
      );

      if (sumupUser) {

        const { data: driver } =
          await supabase
            .from("drivers")
            .select("id")
            .ilike(
              "sumup_user_email",
              sumupUser
            )
            .maybeSingle();

        if (driver) {

          driverId = driver.id;

          console.log(
            "✅ DRIVER:",
            driverId
          );

        } else {

          console.log(
            "❌ DRIVER BULUNAMADI:",
            sumupUser
          );
        }
      }

      // DUPLICATE CHECK
      const { data: existing } =
        await supabase
          .from("sumup_transactions")
          .select("id")
          .eq(
            "transaction_id",
            transactionId
          )
          .maybeSingle();

      // INSERT TRANSACTION
      if (!existing) {

        const { error: insertError } =
          await supabase
            .from("sumup_transactions")
            .insert({

              driver_id: driverId,

              date: txDate,

              amount,

              fee,

              net_amount: amount - fee,

              transaction_id: transactionId,

              status: tx.status,

              currency: tx.currency,

              payment_type: tx.payment_type,

              card_type:
                tx.card?.type || null,
            });

        if (insertError) {

          console.log(
            "❌ TRANSACTION INSERT:",
            insertError
          );

          continue;
        }

        console.log(
          "💾 transaction kayıt:",
          transactionId
        );
      }

      // DAILY SUMMARY RECALCULATE
      if (driverId) {

        // O GÜNÜN GERÇEK TOPLAMI
        const { data: allDayTransactions } =
          await supabase
            .from("sumup_transactions")
            .select("amount")
            .eq("driver_id", driverId)
            .eq("date", txDate);

        const realTotal =
          (allDayTransactions || []).reduce(
            (sum, t) =>
              sum +
              Number(t.amount || 0),
            0
          );

        console.log(
          "📊 REAL TOTAL:",
          realTotal
        );

        const {
          data: existingSummary,
        } = await supabase
          .from("driver_daily_summary")
          .select("*")
          .eq("driver_id", driverId)
          .eq("date", txDate)
          .maybeSingle();

        // UPDATE
        if (existingSummary) {

          const boltIncome =
            Number(
              existingSummary.bolt_income || 0
            );

          const uberIncome =
            Number(
              existingSummary.uber_income || 0
            );

          const { error: updateError } =
            await supabase
              .from(
                "driver_daily_summary"
              )
              .update({

                sumup_income:
                  realTotal,

                sumup:
                  realTotal,

                total_income:
                  boltIncome +
                  uberIncome +
                  realTotal,
              })
              .eq(
                "id",
                existingSummary.id
              );

          if (updateError) {

            console.log(
              "❌ SUMMARY UPDATE:",
              updateError
            );

          } else {

            console.log(
              "✅ SUMMARY UPDATE:",
              realTotal
            );
          }

        }

        // INSERT
        else {

          const { error: insertSummaryError } =
            await supabase
              .from(
                "driver_daily_summary"
              )
              .insert({

                driver_id: driverId,

                date: txDate,

                bolt_income: 0,

                uber_income: 0,

                sumup_income:
                  realTotal,

                sumup:
                  realTotal,

                total_income:
                  realTotal,
              });

          if (insertSummaryError) {

            console.log(
              "❌ SUMMARY INSERT:",
              insertSummaryError
            );

          } else {

            console.log(
              "✅ SUMMARY INSERT:",
              realTotal
            );
          }
        }
      }
    }

    console.log(
      "✅ SYNC TAMAMLANDI"
    );

  } catch (err) {

    console.log(
      "❌ HATA:",
      err.response?.data ||
      err.message
    );
  }
}

syncSumupTransactions();