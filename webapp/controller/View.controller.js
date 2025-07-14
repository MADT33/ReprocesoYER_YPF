sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/export/Spreadsheet",
    "sap/ui/export/library",
    'sap/ui/comp/smartvariants/PersonalizableInfo'
],
    function (Controller, JSONModel, Filter, FilterOperator, Fragment, MessageToast, MessageBox,
        Spreadsheet, library, PersonalizableInfo
    ) {
        "use strict";

        return Controller.extend("ypf.zz1com741lm4free2.controller.View", {
            onInit: function () {

                var oView = this.getView();
                var oDataModel = this.getOwnerComponent().getModel();
                var that = this;

                oDataModel.read("/VHClientesSet", {
                    success: function (oData) {
                        var oVHModel = new sap.ui.model.json.JSONModel();
                        oVHModel.setData({ VHClientes: oData.results });
                        oView.setModel(oVHModel, "VHModel");
                    },
                    error: function () {
                        sap.m.MessageToast.show("Error al cargar clientes");
                    }
                });

                oDataModel.read("/VHContratosSet", {
                    success: function (oData) {

                        var oVHModel = oView.getModel("VHModel");

                        if (!oVHModel) {

                            oVHModel = new sap.ui.model.json.JSONModel({
                                VHContratos: oData.results
                            });
                            oView.setModel(oVHModel, "VHModel");
                        } else {

                            var oDataNow = oVHModel.getData();
                            oDataNow.VHContratos = oData.results;
                            oVHModel.setData(oDataNow);
                        }
                    },
                    error: function () {
                       
                        MessageToast.show(this._getText("msg.error.erroCarcarContrato"));
                    }
                });


                this.oSmartVariantManagement = this.getView().byId("svm");
                this.oFilterBar = this.getView().byId("filterbar");


                this.oFilterBar.registerFetchData(this.fetchData.bind(this));
                this.oFilterBar.registerApplyData(this.applyData.bind(this));
                this.oFilterBar.registerGetFiltersWithValues(this.getFiltersWithValues.bind(this));


                var oPersInfo = new PersonalizableInfo({
                    type: "filterBar",
                    keyName: "persistencyKey",
                    dataSource: "",
                    control: this.oFilterBar
                });

                this.oSmartVariantManagement.addPersonalizableControl(oPersInfo);
                this.oSmartVariantManagement.initialise(function () { }, this.oFilterBar);




            },
            _getText: function (sKey, aArgs) {
                const oModel = this.getView().getModel("i18n");
                if (!oModel) {
                    
                    return sKey; 
                }
                const oBundle = oModel.getResourceBundle();
                return oBundle.getText(sKey, aArgs);
            },
            fetchData: function () {
                const oView = this.getView();
                return {
                    inputDesde: oView.byId("inputDesde").getValue(),
                    inputHasta: oView.byId("inputHasta").getValue()
                };
            },

            applyData: function (oData) {
                const oView = this.getView();

                if (oData.inputDesde !== undefined) {
                    oView.byId("inputDesde").setValue(oData.inputDesde);
                }

                if (oData.inputHasta !== undefined) {
                    oView.byId("inputHasta").setValue(oData.inputHasta);
                }
            },

            onMultiInputChange: function (oEvent) {
                const oInput = oEvent.getSource();
                const sValue = oEvent.getParameter("value");

                if (!sValue) return;

                const aValues = sValue
                    .split(/[\n,; ]+/)
                    .map(s => s.trim())
                    .filter(Boolean);

                oInput.setValue("");

                aValues.forEach(sVal => {
                    const oToken = new sap.m.Token({ key: sVal, text: sVal });
                    oInput.addToken(oToken);
                });

            },
            getFiltersWithValues: function () {
                const oView = this.getView();
                const aFilters = [];

                const sDesde = oView.byId("inputDesde").getValue();
                const sHasta = oView.byId("inputHasta").getValue();

                if (sDesde) {
                    aFilters.push(new Filter("fechaDesde", FilterOperator.GE, sDesde));
                }

                if (sHasta) {
                    aFilters.push(new Filter("fechaHasta", FilterOperator.LE, sHasta));
                }

                return aFilters;
            },

            onGoPress: function () {
                const oView = this.getView();
                var that = this;
                const oInputDesde = oView.byId("inputDesde");
                const oInputHasta = oView.byId("inputHasta");
                const oDesde = oInputDesde.getDateValue();
                const oHasta = oInputHasta.getDateValue();

                let bValid = true;


                if (!oDesde) {
                    oInputDesde.setValueState("Error");
                   
                    oInputDesde.setValueStateText(this._getText("msg.error.fechaDesdeObligatoria"));
                    bValid = false;
                } else {
                    oInputDesde.setValueState("None");
                }

                if (!oHasta) {
                    oInputHasta.setValueState("Error");
                    oInputHasta.setValueStateText(this._getText("msg.error.fechaHastaObligatoria"));
                   
                    bValid = false;
                } else {
                    oInputHasta.setValueState("None");
                }

                if (!bValid) {
                    MessageToast.show(this._getText("msg.toast.fechasObligatorias"));
                   
                    return;
                }



                if (oDesde > oHasta) {
                    oInputDesde.setValueState("Error");
                    oInputDesde.setValueStateText(this._getText("msg.error.fechaDesdeMayor"));
                    oInputHasta.setValueState("Error");
                    oInputHasta.setValueStateText(this._getText("msg.error.fechaHastaMenor"));
                    MessageToast.show(this._getText("msg.toast.fechaDesdeMayor"));
                    return;
                } else {

                    oInputDesde.setValueState("None");
                    oInputDesde.setValueStateText("");
                    oInputHasta.setValueState("None");
                    oInputHasta.setValueStateText("");
                }






                const iDiffMs = oHasta.getTime() - oDesde.getTime();
                const iDiffDays = iDiffMs / (1000 * 60 * 60 * 24);

                if (iDiffDays > 45) {
                    oInputHasta.setValueState("Error");
                   
                    oInputHasta.setValueStateText(this._getText("msg.error.fechaHastaMayor"));
                    MessageToast.show(this._getText("msg.error.fechaHastaMayor"));
                   
                    return;
                } else {
                    oInputHasta.setValueState("None");
                }

                const sDesde = this._formatDate(oDesde);
                const sHasta = this._formatDate(oHasta);


                const aClientesTokens = oView.byId("multiInputCliente").getTokens();
                const aContratosTokens = oView.byId("inputContrato").getTokens();

                const sClientes = aClientesTokens.map(t => t.getKey()).join(",");
                const sContratos = aContratosTokens.map(t => t.getKey()).join(",");
                const sEstado = oView.byId("comboEstado").getValue();



                const oPayload = {
                    FechaDesde: sDesde,
                    FechaHasta: sHasta,
                    Cliente: sClientes,
                    Contrato: sContratos,
                    Estado: sEstado
                };

                const oModel = this.getOwnerComponent().getModel();

                oModel.create("/inDataInicialSet", oPayload, {
                    success: function (oData) {
                        const raw = oData;

                        const parseField = key => (raw[key] || "").split(",");

                        const results = [];
                        const totalItems = parseField("Contrato").length;

                        for (let i = 0; i < totalItems; i++) {
                            results.push({
                                Contrato: parseField("Contrato")[i] || "",
                                DesFactura: parseField("DesFactura")[i] || "",
                                EjercicioDocSellos: parseField("EjercicioDocSellos")[i] || "",
                                EnvMail: parseField("EnvMail")[i] || "",
                                FechaCierre: parseField("FechaCierre")[i] || "",
                                FechaDocSellos: parseField("FechaDocSellos")[i] || "",
                                FechaEmRes: parseField("FechaEmRes")[i] || "",
                                FechaVencResu: parseField("FechaVencResu")[i] || "",
                                NunDocSellos: parseField("NunDocSellos")[i] || "",
                                Periodo: parseField("Periodo")[i] || "",
                                ResEnvEverillion: parseField("ResEnvEverillion")[i] || "",
                                ResEnvPDC: parseField("ResEnvPDC")[i] || "",
                                Solicitante: parseField("Solicitante")[i] || "",
                                StatusRes: parseField("StatusRes")[i] || "",
                                Usuario: parseField("Usuario")[i] || ""
                            });
                        }

                        const oJsonModel = new sap.ui.model.json.JSONModel({ results });
                        oView.setModel(oJsonModel, "ModelContract");
                        oView.setBusy(false);
                    },
                    error: function (oError) {

                        oView.setBusy(false);
                    }
                });

            },


            _formatDate: function (oDate) {
                if (!oDate) return "";

                const iYear = oDate.getFullYear();
                const iMonth = oDate.getMonth() + 1;
                const iDay = oDate.getDate();

                const sMonth = iMonth < 10 ? "0" + iMonth : iMonth;
                const sDay = iDay < 10 ? "0" + iDay : iDay;

                return `${iYear}${sMonth}${sDay}`;
            }

            ,

            _enviarContratos: function (sNavEntity, sSuccessMessage, sErrorMessage) {
                const oView = this.getView();

                oView.setBusy(true);
                const oTable = oView.byId("tablaContratos");
                const aSelectedIndices = oTable.getSelectedIndices();
                const oModel = this.getOwnerComponent().getModel();
                var that = this;

                if (aSelectedIndices.length === 0) {
                 
                    MessageBox.warning(this._getText("msg.warning.seleccionarContrato"));
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
                that._pdfYaGenerado = false;



                oModel.create("/HeaderSet", oPayload, {
                    success: function (oData) {


                        oView.setBusy(false);

                        if (that._pdfYaGenerado) {

                            return;
                        }
                        that._pdfYaGenerado = true;

                        var mensaje = null;

                        if (
                            oData.HeaderToDescargarPdfNav &&
                            Array.isArray(oData.HeaderToDescargarPdfNav.results) &&
                            oData.HeaderToDescargarPdfNav.results.length > 0
                        ) {
                            const results = oData.HeaderToDescargarPdfNav.results;



                            const clavesUnicas = new Set();

                            for (let i = 0; i < results.length; i++) {
                                const item = results[i];
                                const nombrePdf = item.NombrePdf;
                                const pdfBase64 = item.Pdf;
                                const mensajeItem = item.Mensaje;

                                const clave = nombrePdf + "::" + pdfBase64;

                                if (nombrePdf && pdfBase64) {
                                    if (!clavesUnicas.has(clave)) {
                                        clavesUnicas.add(clave);


                                        that._crearPdf(nombrePdf, pdfBase64);

                                        if (!mensaje) {
                                            mensaje = mensajeItem;
                                        }
                                    } else {

                                    }
                                } else {

                                }
                            }
                        } else if (
                            oData.HeaderToCancelarResumenNav &&
                            Array.isArray(oData.HeaderToCancelarResumenNav.results) &&
                            oData.HeaderToCancelarResumenNav.results[0]
                        ) {
                            mensaje = oData.HeaderToCancelarResumenNav.results[0].Mensaje;

                        } else if (
                            oData.HeaderToEnviarEverillionNav &&
                            Array.isArray(oData.HeaderToEnviarEverillionNav.results) &&
                            oData.HeaderToEnviarEverillionNav.results[0]
                        ) {
                            mensaje = oData.HeaderToEnviarEverillionNav.results[0].Mensajes;

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

                        if (mensaje) {
                            sap.m.MessageBox.information(mensaje);
                        } else {
                           
                            sap.m.MessageBox.information(this._getText("msg.information.oDataCall"));
                        }
                    },

                    error: function (oError) {
                        MessageBox.error(this._getText("msg.error.errorSolicitud"));

                    }
                });
            },


            _crearPdf: function (nombrePdf, pdfBase64) {


                if (!pdfBase64 || typeof pdfBase64 !== "string" || pdfBase64.trim() === "") {
                   
                    MessageBox.error(this._getText("msg.error.errorContenidoPDF"));
                    return;
                }

                try {

                    const byteCharacters = atob(pdfBase64);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }

                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], { type: 'application/pdf' });


                    let safeName = nombrePdf && typeof nombrePdf === "string" ? nombrePdf.trim() : "archivo.pdf";
                    if (!safeName.toLowerCase().endsWith(".pdf")) {
                        safeName += ".pdf";
                    }


                    const link = document.createElement("a");
                    link.href = URL.createObjectURL(blob);
                    link.download = safeName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(link.href);

                } catch (err) {

                    MessageBox.error(this._getText("msg.error.errorArchivoPdf"));
                }



            },




            onGenerarResumen: function () {
                this._confirmAndExecute("¿Está seguro de generar el resumen?", function () {
                    this._enviarContratos(
                        "HeaderToGenerarResumenNav",
                        this._getText("msg.success.generarResumen"),
                        this._getText("msg.error.generarResumen")
                     
                    );
                }.bind(this));
            },

            onEnviarAEverillion: function () {
                this._confirmAndExecute("¿Está seguro de enviar a Everillion?", function () {
                    this._enviarContratos(
                        "HeaderToEnviarEverillionNav",
                        this._getText("msg.success.everillion"),
                        this._getText("msg.error.everillion")
                    );
                }.bind(this));
            },

            onEnviarAPDC: function () {
                this._confirmAndExecute("¿Está seguro de enviar a PDC?", function () {
                    this._enviarContratos(
                        "HeaderToEnviarPDCNav",
                        this._getText("msg.success.pdc"),
                        this._getText("msg.error.pdc")
                    );
                }.bind(this));
            },

            onEnviarPorMail: function () {
                this._confirmAndExecute("¿Está seguro de enviar por mail?", function () {
                    this._enviarContratos(
                        "HeaderToEnviarPorMailNav",
                        this._getText("msg.success.mail"),
                        this._getText("msg.error.mail")
                    );
                }.bind(this));
            },

            onCancelarResumen: function () {
                this._confirmAndExecute("¿Está seguro de cancelar el resumen?", function () {
                    this._enviarContratos(
                        "HeaderToCancelarResumenNav",
                        this._getText("msg.success.cancelarResumen"),
                        this._getText("msg.error.cancelarResumen")
                    );
                }.bind(this));
            },

            onDescargarPDF: function () {
                this._confirmAndExecute("¿Está seguro de descargar el PDF?", function () {
                    this._enviarContratos(
                        "HeaderToDescargarPdfNav",
                        this._getText("msg.success.generarPdf"),
                        this._getText("msg.error.generarPdf")
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

            onValueHelpCliente: function (oEvent) {
                var sInputValue = oEvent.getSource().getValue();
                var oView = this.getView();

                if (!this._pValueHelpClienteDialog) {
                    this._pValueHelpClienteDialog = Fragment.load({
                        id: "idVHCliente",
                        name: "ypf.zz1com741lm4free2.view.ValueHelpClientes",
                        controller: this
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog);
                        oDialog.setModel(this.getView().getModel("VHModel"));


                        oDialog.attachConfirm(this._handleValueHelpClienteClose, this);
                        oDialog.attachSearch(this._handleValueHelpClienteSearch, this);

                        return oDialog;
                    }.bind(this));
                }

                this._pValueHelpClienteDialog.then(function (oDialog) {
                    var oBinding = oDialog.getBinding("items");
                    if (oBinding) {
                        oBinding.filter([
                            new sap.ui.model.Filter("Clientes", sap.ui.model.FilterOperator.Contains, sInputValue)
                        ]);
                    }
                    oDialog.open(sInputValue);
                });
            },


            onValueHelpContrato: function (oEvent) {
                var sInputValue = oEvent.getSource().getValue();
                var oView = this.getView();


                if (!this._pValueHelpContratoDialog) {
                    this._pValueHelpContratoDialog = Fragment.load({
                        id: "idVHContrato",
                        name: "ypf.zz1com741lm4free2.view.ValueHelpContrato",
                        controller: this
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog);


                        oDialog.setModel(this.getView().getModel("VHModel"));


                        oDialog.attachConfirm(this._handleValueHelpContratoClose, this);
                        oDialog.attachSearch(this._handleValueHelpContratoSearch, this);

                        return oDialog;
                    }.bind(this));
                }


                this._pValueHelpContratoDialog.then(function (oDialog) {
                    var oBinding = oDialog.getBinding("items");
                    if (oBinding) {
                        oBinding.filter([
                            new sap.ui.model.Filter("Contrato", sap.ui.model.FilterOperator.Contains, sInputValue)
                        ]);
                    }

                    oDialog.open(sInputValue);
                });
            },
            onValueHelpCancel: function (oEvent) {

                var aSelectedItems = oEvent.getParameter("selectedItems");
                var oMultiInput = this.byId("multiInputCliente");

                if (aSelectedItems && aSelectedItems.length > 0 && oMultiInput) {
                    var aExistingTokens = oMultiInput.getTokens().map(function (token) {
                        return token.getKey();
                    });

                    aSelectedItems.forEach(function (oItem) {
                        var sKey = oItem.getTitle();
                        var sText = oItem.getDescription();

                        if (!aExistingTokens.includes(sKey)) {
                            oMultiInput.addToken(new sap.m.Token({
                                key: sKey,
                                text: sKey + " - " + sText
                            }));
                        }
                    });
                }


            },



            onValueHelpContratoCancel: function (oEvent) {
                var aSelectedItems = oEvent.getParameter("selectedItems");
                var oMultiInput = this.byId("inputContrato");

                if (aSelectedItems && aSelectedItems.length > 0 && oMultiInput) {
                    var aExistingTokens = oMultiInput.getTokens().map(function (token) {
                        return token.getKey();
                    });

                    aSelectedItems.forEach(function (oItem) {
                        var sKey = oItem.getTitle();
                        var sText = oItem.getDescription();

                        if (!aExistingTokens.includes(sKey)) {
                            oMultiInput.addToken(new sap.m.Token({
                                key: sKey,
                                text: sKey + " - " + sText
                            }));
                        }
                    });
                }

            },
            onSearchContrato: function (oEvent) {
                var sValue = oEvent.getParameter("value");
                var oFilter = new sap.ui.model.Filter(
                    "Contrato",
                    sap.ui.model.FilterOperator.Contains,
                    sValue
                );
                oEvent.getSource().getBinding("items").filter([oFilter]);
            },

            onSearch: function (oEvent) {
                var sValue = oEvent.getParameter("value");
                var oFilter = new sap.ui.model.Filter(
                    "Clientes",
                    sap.ui.model.FilterOperator.Contains,
                    sValue
                );
                oEvent.getSource().getBinding("items").filter([oFilter]);
            }





        });
    });
