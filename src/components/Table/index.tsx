import React from "react";
import { Dataset, Dimension, Measure } from "@embeddable.com/core";
import { DataResponse } from "@embeddable.com/core";

// Props for the table component
type Props = {
  ds: Dataset;
  columns: (Dimension | Measure)[]; // Columns passed as props
  results: DataResponse; // Results passed as props
};

const TableComponent = ({ ds, columns, results }: Props) => {
  const { isLoading, data, error } = results;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message || "An error occurred"}</div>;
  }

  const safeData = data || [];

  // Identify the second column (assuming it's at index 1)
  const secondColumn = columns[1]?.name;
  if (!secondColumn) {
    return <div>Error: Second column not found</div>;
  }

  // Calculate the sum of the second column values
  const totalValue = safeData.reduce((sum, row) => {
    const value = parseFloat(row[secondColumn]) || 0; // Ensure number conversion
    return sum + value;
  }, 0);

  console.log("Second Column:", totalValue);

  return (
    <div className="table-container">
      <table className="table">
        {/* Table Head */}
        <thead className="table-header">
          <tr>
            <th colSpan={columns.length + 1} className="table-header-cell title"
            >
              Store Table
            </th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody>
          {safeData.map((row, index) => (
            <tr key={index} className={`table-row ${index % 2 === 0 ? "even-row" : "odd-row"}`}>
              {columns.map((col, colIndex) => (
                <td key={col.name} className={`table-cell ${colIndex === 0 ? "first-column" : ""}`}>
                  {row[col.name] !== undefined
                    ? colIndex === 1
                      ? parseFloat(row[col.name]) > 999
                        ? parseFloat(row[col.name]).toLocaleString("en-US")
                        : row[col.name]
                      : row[col.name]
                    : "N/A"}
                </td>

              ))}
              <td className="table-cell">
                {totalValue > 0
                  ? ((parseFloat(row["impressions.impression_unfiltered_calculation2"]) / totalValue) * 100).toFixed(0) + "%"
                  : "0.00%"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Component Styles */}
      <style jsx>{`
        .table-container {
          overflow: hidden;
          padding: 15px;
          height:100%;
          background-color: #fff;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);
          border-radius: 8px;
          font-family: Arial, sans-serif;
          font-size: 13px;
          border: 1px solid #ccc,
        }

        .table {
          width: 100%;
          height:100%;
          border-collapse: collapse;
          border-radius: 8px;
          border: 1px solid #ccc,
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);
        }

        .table-header {
          background: linear-gradient(to right, #af3241, #af3241);
          color: white;
        }

        .table-header-cell {
          padding: 12px;
          text-align: left;
          text-transform: uppercase;
          font-weight: bold;
          color: white;
        }

        .table-header-cell.title {
          font-size: 23px;
          text-align: left;
          padding: 20px 12px;
          font-family: Arial, sans-serif;
          color: white;
          font-weight: normal; /* Changed from bold to normal */
          text-transform: none; /* Changed from uppercase to none */
        }


        .table-row {
          transition: background-color 0.2s ease; /* Smooth color transition between rows */
        }

        .even-row {
          background-color: #af3241; /* Even row color */
        }

        .odd-row {
          background-color: black; /* Odd row color */
        }

        .table-cell {
          padding: 12px;
          text-align: left;
          color: white;
        }

        .first-column {
          font-weight: bold;
        }
      `}</style>
    </div>
  );
};

export default TableComponent;
