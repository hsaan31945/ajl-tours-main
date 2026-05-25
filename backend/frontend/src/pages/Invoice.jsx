import React from "react";
import { useLocation } from "react-router-dom";
import {
  PDFDownloadLink,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import Button from "../components/Button";
import { useCurrency } from "../context/CurrencyContext";

const styles = StyleSheet.create({
  page: { padding: 30 },
  title: { fontSize: 24, marginBottom: 20 },
  section: { marginBottom: 10 },
  label: { fontWeight: "bold" },
});

const InvoicePDF = ({ booking, symbol }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Booking Invoice</Text>
      <View style={styles.section}>
        <Text style={styles.label}>Customer Details</Text>
        <Text>Name: {booking.name}</Text>
        <Text>Email: {booking.email}</Text>
        <Text>Phone: {booking.phone}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Package Details</Text>
        <Text>Tour: {booking.tourTitle}</Text>
        <Text>Number of Travelers: {booking.travelers}</Text>
        <Text>Total Price: {symbol}{Number(booking.totalPrice).toFixed(2)}</Text>
      </View>
    </Page>
  </Document>
);

const Invoice = () => {
  const location = useLocation();
  const booking = location.state?.booking;
  const { symbol } = useCurrency();

  if (!booking) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold mb-6">Error: No Booking Data</h2>
        <p>
          There was an error retrieving your booking information. Please try
          again or contact customer support.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white/40 rounded-lg shadow-lg mt-[150px] sm:mt-24 mb-[220px] sm:mb-0">
      <h2 className="text-3xl font-bold mb-6">
        Booking <span className="text-red-600">Invoice</span>{" "}
      </h2>
      <div>
        <h3 className="text-2xl font-semibold mb-5">Customer Details</h3>
        <p>
          <strong>Name:</strong> {booking.name}
        </p>
        <p>
          <strong>Email:</strong> {booking.email}
        </p>
        <p>
          <strong>Phone:</strong> {booking.phone}
        </p>
      </div>
      <div className="mt-6">
        <h3 className="text-2xl font-semibold mb-5">Package Details</h3>
        <p>
          <strong>Tour:</strong> {booking.tourTitle}
        </p>
        <p>
          <strong>Number of Travelers: </strong>
          {booking.travelers}
        </p>
        <p>
          <strong>Total Price:</strong> {symbol}{Number(booking.totalPrice).toFixed(2)}
        </p>
      </div>
      <div className="mt-6">
        {booking ? (
          <PDFDownloadLink
            document={<InvoicePDF booking={booking} symbol={symbol} />}
            fileName="booking_invoice.pdf"
          >
            {({ blob, url, loading, error }) =>
              loading ? (
                <Button
                  text="Loading document..."
                  className="px-6 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition duration-300"
                />
              ) : (
                <Button
                  text="Download Invoice PDF"
                  className="px-6 py-3 bg-gradient-to-b from-red-500 to-red-700 text-white font-semibold rounded-lg hover:from-black hover:to-red-800 transition duration-300 "
                />
              )
            }
          </PDFDownloadLink>
        ) : (
          <p>Unable to generate PDF: Missing booking data</p>
        )}
      </div>
    </div>
  );
};

export default Invoice;
