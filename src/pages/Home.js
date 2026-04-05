import { Link } from "react-router-dom";

function Home() {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Patient Management System</h1>
      <p style={styles.subtitle}>
        Manage patients easily and efficiently 🚀
      </p>

      <div style={styles.buttons}>
        <Link to="/login">
          <button style={styles.btn}>Login</button>
        </Link>

        <Link to="/dashboard">
          <button style={styles.btnSecondary}>Dashboard</button>
        </Link>
      </div>
    </div>
  );
}

const styles = {
  container: {
    textAlign: "center",
    marginTop: "100px",
  },
  title: {
    fontSize: "36px",
    marginBottom: "10px",
  },
  subtitle: {
    fontSize: "18px",
    marginBottom: "30px",
  },
  buttons: {
    display: "flex",
    justifyContent: "center",
    gap: "15px",
  },
  btn: {
    padding: "10px 20px",
    fontSize: "16px",
    cursor: "pointer",
  },
  btnSecondary: {
    padding: "10px 20px",
    fontSize: "16px",
    backgroundColor: "#555",
    color: "white",
    cursor: "pointer",
  },
};

export default Home;