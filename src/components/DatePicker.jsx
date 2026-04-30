import { forwardRef, useState, useEffect, useCallback } from "react";
import DatePickerReact from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ptBR from "date-fns/locale/pt-BR";

// ==================== INPUT COM MÁSCARA ====================
const CustomInput = forwardRef(({ value, onClick, onChangeDatePicker, ...rest }, ref) => {
  const [texto, setTexto] = useState(value || "");

  useEffect(() => {
    if (value && value !== texto) {
      setTexto(value);
    }
  }, [value]);

  const aplicarMascara = (input) => {
    let digitos = input.replace(/\D/g, "").slice(0, 8);
    if (digitos.length > 2) digitos = digitos.slice(0, 2) + "/" + digitos.slice(2);
    if (digitos.length > 5) digitos = digitos.slice(0, 5) + "/" + digitos.slice(5);
    return digitos;
  };

  const handleChange = (e) => {
    const mascara = aplicarMascara(e.target.value);
    setTexto(mascara);
    if (mascara.length === 10) {
      const [dia, mes, ano] = mascara.split("/");
      const data = new Date(`${ano}-${mes}-${dia}T00:00:00`);
      if (
        data.getDate() === parseInt(dia) &&
        data.getMonth() + 1 === parseInt(mes) &&
        data.getFullYear() === parseInt(ano)
      ) {
        onChangeDatePicker?.(data);
      }
    }
  };

  return (
    <input
      {...rest}
      ref={ref}
      value={texto}
      onChange={handleChange}
      onClick={onClick}
      placeholder="dd/mm/aaaa"
      className={`form-control ${rest.className || ''}`}
      style={rest.style}
    />
  );
});
CustomInput.displayName = "CustomInput";

// ==================== MESES EM PORTUGUÊS ====================
const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

//maxDate={maxDate} 🔒 Restringe seleção até a data definida (padrão: ilimitado)
const DatePicker = forwardRef(({ value, onChange, maxDate = null, ...props }, ref) => {
  const [selectedDate, setSelectedDate] = useState(
    value ? new Date(value + "T00:00:00") : null
  );
  const [openToDate, setOpenToDate] = useState(
    value ? new Date(value + "T00:00:00") : new Date()
  );
  const [view, setView] = useState("calendar"); // calendar | years | months
  const [isOpen, setIsOpen] = useState(false);
  const [yearRange, setYearRange] = useState(
    Math.floor(openToDate.getFullYear() / 12) * 12
  );

  useEffect(() => {
    if (value) {
      const d = new Date(value + "T00:00:00");
      setSelectedDate(d);
      setOpenToDate(d);
    } else {
      setSelectedDate(null);
      setOpenToDate(new Date());
    }
  }, [value]);

  const handleDateChange = useCallback(
    (date) => {
      if (!date) return;
      setSelectedDate(date);
      setOpenToDate(date);
      setIsOpen(false);
      if (onChange) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        onChange(`${y}-${m}-${d}`);
      }
    },
    [onChange]
  );

  const selectYear = (year) => {
    const newDate = new Date(openToDate);
    newDate.setFullYear(year);
    setOpenToDate(newDate);
    setView("months");
  };

  const selectMonth = (monthIndex) => {
    const newDate = new Date(openToDate);
    newDate.setMonth(monthIndex, 1);
    setOpenToDate(newDate);
    setView("calendar");
  };

  const prevYearBlock = () => setYearRange(yearRange - 12);
  const nextYearBlock = () => setYearRange(yearRange + 12);

  const toggleOpen = () => {
    setIsOpen((atual) => !atual);
  };

  // Estilo base das grades (anos e meses)
  const gradeStyle = {
    position: "fixed",
    zIndex: 9999,
    background: "white",
    border: "1px solid #ccc",
    borderRadius: "8px",
    padding: "16px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "320px",
  };

  // ==================== GRADE DE ANOS ====================
  if (view === "years" && isOpen) {
    const anos = [];
    for (let i = yearRange; i < yearRange + 12; i++) anos.push(i);
    return (
      <div className="react-datepicker-wrapper">
        <CustomInput
          value={selectedDate ? `${String(selectedDate.getDate()).padStart(2, "0")}/${String(selectedDate.getMonth() + 1).padStart(2, "0")}/${selectedDate.getFullYear()}` : ""}
          onClick={toggleOpen}
          onChangeDatePicker={handleDateChange}
          {...props}
        />
        <div style={gradeStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <button onClick={prevYearBlock} style={navBtnStyle}>←</button>
            <strong>Selecione o ano</strong>
            <button onClick={nextYearBlock} style={navBtnStyle}>→</button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
            {anos.map(ano => {
              // 🔒 Desabilita anos futuros se maxDate estiver definido
              const anoLimite = maxDate ? maxDate.getFullYear() : Infinity;
              const desabilitado = ano > anoLimite;

              return (
                <button
                  key={ano}
                  disabled={desabilitado}
                  onClick={() => !desabilitado && selectYear(ano)}
                  style={{
                    width: 60, padding: "8px 0",
                    border: `1px solid ${desabilitado ? "#e2e8f0" : (ano === openToDate.getFullYear() ? "#f97316" : "#ccc")}`,
                    borderRadius: 4,
                    background: desabilitado ? "#f1f5f9" : (ano === openToDate.getFullYear() ? "#f97316" : "transparent"),
                    color: desabilitado ? "#94a3b8" : (ano === openToDate.getFullYear() ? "#fff" : "#333"),
                    cursor: desabilitado ? "not-allowed" : "pointer",
                    fontWeight: ano === openToDate.getFullYear() && !desabilitado ? "bold" : "normal"
                  }}
                >{ano}</button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ==================== GRADE DE MESES ====================
  if (view === "months" && isOpen) {
    return (
      <div className="react-datepicker-wrapper">
        <CustomInput
          value={selectedDate ? `${String(selectedDate.getDate()).padStart(2, "0")}/${String(selectedDate.getMonth() + 1).padStart(2, "0")}/${selectedDate.getFullYear()}` : ""}
          onClick={toggleOpen}
          onChangeDatePicker={handleDateChange}
          {...props}
        />
        <div style={gradeStyle}>
          <div style={{ marginBottom: 12, textAlign: "center" }}>
            <strong>Selecione o mês</strong>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
            {MESES.map((nome, idx) => {
                // 🔒 Desabilita meses futuros se maxDate estiver definido e o ano for o atual
                const anoAtualGrade = openToDate.getFullYear();
                const anoLimite = maxDate ? maxDate.getFullYear() : Infinity;
                const mesLimite = maxDate ? maxDate.getMonth() : Infinity;
                
                // Só restringe se o ano selecionado for o ano do maxDate
                const desabilitado = maxDate && anoAtualGrade === anoLimite && idx > mesLimite;

                return (
                  <button
                    key={nome}
                    disabled={desabilitado}
                    onClick={() => !desabilitado && selectMonth(idx)}
                    style={{
                      width: 70,
                      padding: "8px 0",
                      border: `1px solid ${desabilitado ? "#e2e8f0" : (idx === openToDate.getMonth() ? "#f97316" : "#ccc")}`,
                      borderRadius: 4,
                      background: desabilitado ? "#f1f5f9" : (idx === openToDate.getMonth() ? "#f97316" : "transparent"),
                      color: desabilitado ? "#94a3b8" : (idx === openToDate.getMonth() ? "#fff" : "#333"),
                      cursor: desabilitado ? "not-allowed" : "pointer",
                      fontWeight: idx === openToDate.getMonth() && !desabilitado ? "bold" : "normal"
                    }}
                  >{nome.substring(0, 3)}</button>
                );
              })}
          </div>
        </div>
      </div>
    );
  }

  // ==================== CALENDÁRIO DE DIAS (centralizado) ====================
  return (
    <div className="react-datepicker-wrapper">
      <CustomInput
        value={selectedDate ? `${String(selectedDate.getDate()).padStart(2, "0")}/${String(selectedDate.getMonth() + 1).padStart(2, "0")}/${selectedDate.getFullYear()}` : ""}
        onClick={toggleOpen}
        onChangeDatePicker={handleDateChange}
        {...props}
      />
      {isOpen && view === "calendar" && (
        <div style={{
          position: "fixed",
          zIndex: 9999,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}>
          <DatePickerReact
            inline
            selected={selectedDate}
            onChange={handleDateChange}
            openToDate={openToDate}
            dateFormat="dd/MM/yyyy"
            locale={ptBR}
            maxDate={maxDate}   // 🔒 Restringe seleção até a data definida (padrão: ilimitado)
            showYearDropdown={false}
            showMonthDropdown={false}
            renderCustomHeader={({
              date,
              decreaseMonth,
              increaseMonth,
              prevMonthButtonDisabled,
              nextMonthButtonDisabled,
            }) => {
              const mesAno = `${MESES[date.getMonth()]} ${date.getFullYear()}`;
              return (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "10px 0" }}>
                  <button
                    type="button"
                    onClick={decreaseMonth}
                    disabled={prevMonthButtonDisabled}
                    style={{ ...navBtnStyle, marginRight: 12 }}
                  >←</button>
                  <button
                    type="button"
                    onClick={() => setView("years")}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      fontSize: 18, fontWeight: "bold", color: "#ffffff", padding: "0 12px"
                    }}
                  >
                    {mesAno}
                  </button>
                  <button
                    type="button"
                    onClick={increaseMonth}
                    disabled={nextMonthButtonDisabled}
                    style={{ ...navBtnStyle, marginLeft: 12 }}
                  >→</button>
                </div>
              );
            }}
          />
        </div>
      )}
    </div>
  );
});

const navBtnStyle = {
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: "18px",
  padding: "4px 8px",
  color: "#1a237e"
};

DatePicker.displayName = "DatePicker";
export default DatePicker;