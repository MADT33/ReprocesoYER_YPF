sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
],
    function (Controller, JSONModel, Filter, FilterOperator, Fragment, MessageToast, MessageBox) {
        "use strict";

        return Controller.extend("ypf.zz1com741lm4free2.controller.View", {
            onInit: function () {


                

            },

            onGoPress: function () {
                const oView = this.getView();
                var that = this;
                const oInputDesde = oView.byId("inputDesde");
                const oInputHasta = oView.byId("inputHasta");
                const oDesde = oInputDesde.getDateValue();
                const oHasta = oInputHasta.getDateValue();

                let bValid = true;

                // Validar fechas obligatorias
                if (!oDesde) {
                    oInputDesde.setValueState("Error");
                    oInputDesde.setValueStateText("La fecha 'Desde' es obligatoria");
                    bValid = false;
                } else {
                    oInputDesde.setValueState("None");
                }

                if (!oHasta) {
                    oInputHasta.setValueState("Error");
                    oInputHasta.setValueStateText("La fecha 'Hasta' es obligatoria");
                    bValid = false;
                } else {
                    oInputHasta.setValueState("None");
                }

                if (!bValid) {
                    MessageToast.show("Por favor, completá las fechas obligatorias.");
                    return;
                }

                // Validar diferencia máxima de 45 días
                const iDiffMs = oHasta.getTime() - oDesde.getTime();
                const iDiffDays = iDiffMs / (1000 * 60 * 60 * 24);

                if (iDiffDays > 45) {
                    oInputHasta.setValueState("Error");
                    oInputHasta.setValueStateText("La fecha 'Hasta' no puede superar los 45 días desde la fecha 'Desde'");
                    MessageToast.show("La fecha 'Hasta' no puede superar los 45 días desde 'Desde'.");
                    return;
                } else {
                    oInputHasta.setValueState("None");
                }

                const sDesde = this._formatDate(oDesde);
                const sHasta = this._formatDate(oHasta);

                // Obtener valores de los MultiInput
                const aClientesTokens = oView.byId("multiInputCliente").getTokens();
                const aContratosTokens = oView.byId("inputContrato").getTokens();

                const sClientes = aClientesTokens.map(t => t.getKey()).join(",");
                const sContratos = aContratosTokens.map(t => t.getKey()).join(",");
                const sEstado = oView.byId("comboEstado").getValue();

                // Mensaje informativo si están vacíos, pero sin bloquear
                /*if (aClientesTokens.length === 0) {
                    MessageToast.show("Advertencia: no se seleccionó ningún Cliente.");
                }
                if (aContratosTokens.length === 0) {
                    MessageToast.show("Advertencia: no se seleccionó ningún Contrato.");
                }*/

                const oPayload = {
                    FechaDesde: sDesde,
                    FechaHasta: sHasta,
                    Cliente: sClientes,
                    Contrato: sContratos,
                    Estado : sEstado 
                };

                const oModel = this.getOwnerComponent().getModel();

                oModel.create("/inDataInicialSet", oPayload, {
                    success: function (oData) {
                        const oRawData = oData; // Esto es lo que devuelve tu OData

                        // Lista de campos a procesar
                        const aFields = [
                            "Contrato",
                            "DesFactura",
                            "EjercicioDocSellos",
                            "EnvMail",
                            "FechaCierre",
                            "FechaDocSellos",
                            "FechaEmRes",
                            "FechaVencResu",
                            "Periodo",                               
                            "ResEnvEverillion",
                            "ResEnvPDC",
                            "Solicitante",
                            "StatusRes",
                            "Usuario"
                        ];

                        // Convertimos cada campo en un array de valores (split por coma, filtrando vacíos)
                        const aParsedFields = {};
                        aFields.forEach(field => {
                            const sRaw = oRawData[field] || "";
                            aParsedFields[field] = sRaw.split(",").filter(item => item !== "");
                        });

                        // Determinamos la cantidad de registros (usamos "Contrato" como referencia)
                        const iLength = aParsedFields["Contrato"].length;

                        // Armamos el array de resultados
                        const aResults = [];
                        for (let i = 0; i < iLength; i++) {
                            const oRow = {};
                            aFields.forEach(field => {
                                oRow[field] = aParsedFields[field][i] || "";
                            });
                            aResults.push(oRow);
                        }

                        // Creamos el modelo JSON con propiedad `results` y lo asignamos
                        const oModelContract = new sap.ui.model.json.JSONModel({ results: aResults });
                        oView.setModel(oModelContract, "ModelContract");

                    },
                    error: function () {
                        MessageToast.show("Error al enviar los datos.");
                    }
                });
            },
          
           
                _formatDate: function (oDate) {
                    if (!oDate) return "";
                
                    const iYear = oDate.getFullYear();
                    const iMonth = oDate.getMonth() + 1; // Meses van de 0 a 11
                    const iDay = oDate.getDate();
                
                    const sMonth = iMonth < 10 ? "0" + iMonth : iMonth;
                    const sDay = iDay < 10 ? "0" + iDay : iDay;
                
                    return `${iYear}${sMonth}${sDay}`; // yyyyMMdd
                }
            
            ,
            // Función reutilizable
            _enviarContratos: function (sNavEntity, sSuccessMessage, sErrorMessage) {
                const oView = this.getView();
                const oTable = oView.byId("tablaContratos");
                const aSelectedIndices = oTable.getSelectedIndices();
                const oModel = this.getOwnerComponent().getModel();
                var that = this;

                if (aSelectedIndices.length === 0) {
                    MessageBox.warning("Debe seleccionar al menos un contrato.");
                    return;
                }

                const aContratos = [];

                aSelectedIndices.forEach(index => {
                    const oContext = oTable.getContextByIndex(index);
                    const oRowData = oContext.getObject();

                    aContratos.push({
                        DesFactura: oRowData.DesFactura,
                        Contrato: oRowData.Contrato,
                        FechaCierre: oRowData.FechaCierre,
                        FechaVencResu: oRowData.FechaVencResu,
                        StatusRes: oRowData.StatusRes,
                        FechaEmRes: oRowData.FechaEmRes,
                        Periodo: oRowData.Periodo,
                        Solicitante: oRowData.Solicitante,
                        EjercicioDocSellos: oRowData.EjercicioDocSellos,
                        FechaDocSellos: oRowData.FechaDocSellos,
                        ResEnvEverillion: oRowData.ResEnvEverillion,
                        ResEnvPDC: oRowData.ResEnvPDC,
                        Usuario: oRowData.Usuario,
                        EnvMail: oRowData.EnvMail
                    });
                });

                const oPayload = {
                    Key: "x"
                };
                oPayload[sNavEntity] = aContratos;

                oModel.create("/HeaderSet", oPayload, {
                    success: function (oData) {

                        var mensaje = null;
                        if (
                            oData.HeaderToCancelarResumenNav &&
                            Array.isArray(oData.HeaderToCancelarResumenNav.results) &&
                            oData.HeaderToCancelarResumenNav.results[0]
                        ) {
                            mensaje = oData.HeaderToCancelarResumenNav.results[0].Mensaje;
                        
                        } else if (
                            oData.HeaderToDescargarPdfNav &&
                            Array.isArray(oData.HeaderToDescargarPdfNav.results) &&
                            oData.HeaderToDescargarPdfNav.results[0]
                        ) {
                            mensaje = oData.HeaderToDescargarPdfNav.results[0].Mensaje;
                            var nombrePdf = oData.HeaderToDescargarPdfNav.results[0].NombrePdf;
                            var pdfBase64  = oData.HeaderToDescargarPdfNav.results[0].Pdf;
                        
                            that._crearPdf(nombrePdf,  pdfBase64);
                        
                        } else if (
                            oData.HeaderToEnviarEverillionNav &&
                            Array.isArray(oData.HeaderToEnviarEverillionNav.results) &&
                            oData.HeaderToEnviarEverillionNav.results[0]
                        ) {
                            mensaje = oData.HeaderToEnviarEverillionNav.results[0].Mensaje;
                        
                        } else if (
                            oData.HeaderToEnviarPDCNav &&
                            Array.isArray(oData.HeaderToEnviarPDCNav.results) &&
                            oData.HeaderToEnviarPDCNav.results[0]
                        ) {
                            mensaje = oData.HeaderToEnviarPDCNav.results[0].Mensaje;
                        
                        } else if (
                            oData.HeaderToEnviarPorMailNav &&
                            Array.isArray(oData.HeaderToEnviarPorMailNav.results) &&
                            oData.HeaderToEnviarPorMailNav.results[0]
                        ) {
                            mensaje = oData.HeaderToEnviarPorMailNav.results[0].Mensaje;
                        
                        } else if (
                            oData.HeaderToGenerarResumenNav &&
                            Array.isArray(oData.HeaderToGenerarResumenNav.results) &&
                            oData.HeaderToGenerarResumenNav.results[0]
                        ) {
                            mensaje = oData.HeaderToGenerarResumenNav.results[0].Mensaje;
                        }
                        
                        // Mostrar mensaje
                        if (mensaje) {
                            sap.m.MessageBox.information(mensaje);
                        } else {
                            sap.m.MessageBox.information("Acción completada, pero no se devolvió un mensaje.");
                        }

                     
                    },
                    error: function (oError) {
                        MessageBox.error(sErrorMessage);
                        console.error(oError);
                    }
                });
            },


            _crearPdf: function (nombrePdf, pdfBase64  ) {

               
                    if (!pdfBase64 || typeof pdfBase64 !== "string" || pdfBase64.trim() === "") {
                        sap.m.MessageBox.error("El contenido del PDF está vacío o es inválido.");
                        return;
                    }
                
                    try {
                        // Decodificar base64 a binario
                        const byteCharacters = atob(pdfBase64);
                        const byteNumbers = new Array(byteCharacters.length);
                        for (let i = 0; i < byteCharacters.length; i++) {
                            byteNumbers[i] = byteCharacters.charCodeAt(i);
                        }
                
                        const byteArray = new Uint8Array(byteNumbers);
                        const blob = new Blob([byteArray], { type: 'application/pdf' });
                
                        // Nombre del archivo, asegurando .pdf
                        let safeName = nombrePdf && typeof nombrePdf === "string" ? nombrePdf.trim() : "archivo.pdf";
                        if (!safeName.toLowerCase().endsWith(".pdf")) {
                            safeName += ".pdf";
                        }
                
                        // Crear enlace para descarga
                        const link = document.createElement("a");
                        link.href = URL.createObjectURL(blob);
                        link.download = safeName;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(link.href);
                
                    } catch (err) {
                        console.error("Error al crear el PDF:", err);
                        sap.m.MessageBox.error("No se pudo generar el archivo PDF.");
                    }
               


            },



            // Botones que usan la función reutilizable
            onGenerarResumen: function () {
                this._confirmAndExecute("¿Está seguro de generar el resumen?", function () {
                    this._enviarContratos(
                        "HeaderToGenerarResumenNav",
                        "Resumen generado correctamente.",
                        "Error al generar el resumen."
                    );
                }.bind(this));
            },
            
            onEnviarAEverillion: function () {
                this._confirmAndExecute("¿Está seguro de enviar a Everillion?", function () {
                    this._enviarContratos(
                        "HeaderToEnviarEverillionNav",
                        "Enviado a Everillion correctamente.",
                        "Error al enviar a Everillion."
                    );
                }.bind(this));
            },
            
            onEnviarAPDC: function () {
                this._confirmAndExecute("¿Está seguro de enviar a PDC?", function () {
                    this._enviarContratos(
                        "HeaderToEnviarPDCNav",
                        "Enviado a PDC correctamente.",
                        "Error al enviar a PDC."
                    );
                }.bind(this));
            },
            
            onEnviarPorMail: function () {
                this._confirmAndExecute("¿Está seguro de enviar por mail?", function () {
                    this._enviarContratos(
                        "HeaderToEnviarPorMailNav",
                        "Enviado por mail correctamente.",
                        "Error al enviar por mail."
                    );
                }.bind(this));
            },
            
            onCancelarResumen: function () {
                this._confirmAndExecute("¿Está seguro de cancelar el resumen?", function () {
                    this._enviarContratos(
                        "HeaderToCancelarResumenNav",
                        "Resumen cancelado correctamente.",
                        "Error al cancelar el resumen."
                    );
                }.bind(this));
            },
            
            onDescargarPDF: function () {
                this._confirmAndExecute("¿Está seguro de descargar el PDF?", function () {
                    this._enviarContratos(
                        "HeaderToDescargarPdfNav",
                        "Resumen generado correctamente.",
                        "Error al generar el resumen."
                    );
                }.bind(this));
            },

            _confirmAndExecute: function (sMessage, fnCallback) {
                MessageBox.warning(
                    sMessage,
                    {
                        actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                        emphasizedAction: MessageBox.Action.YES,
                        onClose: function (sAction) {
                            if (sAction === MessageBox.Action.YES) {
                                fnCallback();
                            }
                        }
                    }
                );
            },

            onValueHelpCliente: function () {
                var oView = this.getView();

                if (!this._oValueHelpDialog) {
                    Fragment.load({
                        name: "ypf.zz1com741lm4free2.view.ValueHelpClientes",
                        controller: this
                    }).then(function (oFragment) {
                        this._oValueHelpDialog = oFragment;
                        oView.addDependent(oFragment);

                        this._oValueHelpDialog.setModel(this.getView().getModel());

                        this._bindValueHelpData();
                        this._oValueHelpDialog.open();
                    }.bind(this));
                } else {
                    this._bindValueHelpData();
                    this._oValueHelpDialog.open();
                }
            },

            _bindValueHelpData: function () {
                // Asegúrate de ajustar el path y el model OData
                this._oValueHelpDialog.bindAggregation("items", {
                    path: "/VHClientesSet",
                    template: new sap.m.StandardListItem({
                        title: "{Clientes}",
                        description: "{Descripcion}"
                    })
                });
            },
            onValueHelpContrato: function () {
                var oView = this.getView();
                if (!this._oVHDContrato) {
                    this._oVHDContrato = sap.ui.xmlfragment("ypf.zz1com741lm4free2.view.ValueHelpContrato", this);
                    oView.addDependent(this._oVHDContrato);
                }

                // Set el modelo si no está seteado dentro del fragmento
                this._oVHDContrato.setModel(this.getView().getModel());

                this._oVHDContrato.open();
            },
            onValueHelpContratoConfirm: function (oEvent) {
                var aSelectedItems = oEvent.getParameter("selectedItems");
                var oMultiInput = this.byId("inputContrato");

                oMultiInput.removeAllTokens();

                aSelectedItems.forEach(function (oItem) {
                    var oToken = new sap.m.Token({
                        key: oItem.getTitle(),
                        text: oItem.getTitle() + " - " + oItem.getDescription()
                    });
                    oMultiInput.addToken(oToken);
                });

                // Ajuste del ancho basado en la cantidad de tokens
                var iTokenCount = aSelectedItems.length;
                var newWidth = Math.min(100, 20 + iTokenCount * 15); // Ejemplo: 20% base + 15% por token
                oMultiInput.setWidth(newWidth + "%");
            },
            onValueHelpContratoCancel: function () {
                if (this._oVHDContrato) {
                    this._oVHDContrato.close();
                }
            },
            onSearchContrato: function (oEvent) {
                var sQuery = oEvent.getParameter("value");
                var oFilter = new sap.ui.model.Filter("Contrato", sap.ui.model.FilterOperator.Contains, sQuery);

                var oDialog = oEvent.getSource();
                var oBinding = oDialog.getBinding("items");

                if (oBinding) {
                    oBinding.filter([oFilter]);
                }
            },

            onSearch: function (oEvent) {
                var sQuery = oEvent.getParameter("value");
                var oDialog = oEvent.getSource();
                var oModel = this.getView().getModel();

                var aFilters = [];
                if (sQuery) {
                    aFilters.push(new sap.ui.model.Filter("Clientes", sap.ui.model.FilterOperator.Contains, sQuery));
                }

                oModel.read("/VHClientesSet", {
                    filters: aFilters,
                    success: function (oData) {
                        var aItems = oData.results.map(function (item) {
                            return new sap.m.StandardListItem({
                                title: item.Clientes,
                                description: item.Descripcion,
                                icon: "sap-icon://value-help"
                            });
                        });
                        oDialog.destroyItems(); // Limpia los items previos
                        aItems.forEach(function (item) {
                            oDialog.addItem(item);
                        });
                    },
                    error: function () {
                        sap.m.MessageToast.show("Error al buscar clientes");
                    }
                });
            },

            onValueHelpConfirm: function (oEvent) {
                var aSelectedItems = oEvent.getParameter("selectedItems");
                var oMultiInput = this.byId("multiInputCliente"); // ID del MultiInput

                oMultiInput.removeAllTokens(); // Opcional: limpiar antes

                if (aSelectedItems && oMultiInput) {
                    aSelectedItems.forEach(function (oItem) {
                        var sKey = oItem.getTitle(); // Ej: Código de cliente
                        var sText = oItem.getDescription(); // Ej: Nombre

                        var oToken = new sap.m.Token({
                            key: sKey,
                            text: sKey + " - " + sText
                        });

                        oMultiInput.addToken(oToken);
                    });
                }

            }

        });
    });
