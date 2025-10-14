import styled from "styled-components";

export const TableContainer = styled.div`
  position: relative;
  left: 0%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 14px;
  width: 100%;
  // max-width: 800px;
`;

export const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 0px;
  font-size: 1em;

  th {
    background-color: rgb(187, 191, 202);
    color: white;
    padding: 5px;
    border: 1px solid #ddd;
    text-align: left;
  }

  td {
    background-color: rgb(244, 244, 242);
    // padding: 5px;
    border: 1px solid #ddd;
    text-align: left;
  }

  tr:nth-child(even) td {
    background-color: rgb(232, 232, 232);
  }

  tr:hover td {
    background-color: #ddd;
  }
`;
