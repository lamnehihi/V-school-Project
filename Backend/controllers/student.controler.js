const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { isSchool, isParent } = require('../middlewares/userAuth.middleware')
const reader = require('xlsx')
const axios = require('axios');
require('dotenv').config();


const instance = axios.create({
    baseURL: process.env.thanhatURL

});

//get all by phone
module.exports.getAllByToken = async (req, res) => {
    try {
        var page = parseInt(req.query.page) || 1;
        var limit = parseInt(req.query.limit) || 10;
        var search = req.query.search;
        var sortParam = req.query.sort;
        var fieldParam = req.query.field;
        var count = 0;
        var userId = req.user.id;
        var listStudent;
        var sortObj;
        sortObj = await objSortFunction(fieldParam, sortParam);

        // neu parent logged
        if (req.user.accRole === 'PARENT') {
            const parent = await prisma.parent.findUnique({
                where: {
                    accountId: userId,
                }
            });
            parentPhone = parent.phone;

            // lay thong tin con
            listStudent = await prisma.student.findMany({
                orderBy: {
                    ...sortObj
                },
                skip: (page - 1) * limit,
                take: limit,
                where: {
                    parentId: parent.id,
                    OR: [{
                        BHYT: {
                            contains: search,
                        },
                    },
                    {
                        name: {
                            contains: search,
                        },
                    },
                    {
                        classcode: {
                            contains: search,
                        },
                    },
                    ],
                },
                include: {
                    invoice_mapping: {
                        where: {
                          OR: [{
                              billId: null,
                          },
                          {
                                billId: '',
                          },
                          {
                            bill: {
                              status: 'pending'
                            },
                          },
                          {
                            bill: {
                              status: 'cancel'
                            },
                          },
                          ],
                    },
                    },
                    parent: true,
                    school: true,
                },
            });
            count = await prisma.student.count({
                where: {
                    parentId: parent.id,
                    OR: [{
                        BHYT: {
                            contains: search,
                        },
                    },
                    {
                        name: {
                            contains: search,
                        },
                    },
                    {
                        classcode: {
                            contains: search,
                        },
                    },
                    ],
                },
            });

        }
        // neu school logged
        else if (req.user.accRole === 'SCHOOL') {
            const school = await prisma.school.findUnique({
                where: {
                    accountId: userId,
                },
            });

            listStudent = await prisma.student.findMany({
                orderBy: {
                    ...sortObj
                },
                skip: (page - 1) * limit,
                take: limit,
                where: {
                    schoolId: school.id,
                    OR: [{
                        BHYT: {
                            contains: search,
                        },
                    },
                    {
                        name: {
                            contains: search,
                        },
                    },
                    {
                        classcode: {
                            contains: search,
                        },
                    },
                    ],
                },
                include: {
                    invoice_mapping: {
                        where: {
                            OR: [{
                                billId: null,
                            },
                            {
                                billId: '',
                            },
                            {
                              bill: {
                                status: 'pending'
                              },
                            },
                            {
                              bill: {
                                status: 'cancel'
                              },
                            },
                            ],
                        },
                    },
                    parent: true,
                    school: true,
                },
            });
            count = await prisma.student.count({
                where: {
                    schoolId: school.id,
                    OR: [{
                        BHYT: {
                            contains: search,
                        },
                    },
                    {
                        name: {
                            contains: search,
                        },
                    },
                    {
                        classcode: {
                            contains: search,
                        },
                    },
                    ],
                },
            });
        }
        // neu admin logged
        else if (req.user.accRole === 'SUPERADMIN') {
            listStudent = await prisma.student.findMany({
                orderBy: {
                    ...sortObj
                },
                skip: (page - 1) * limit,
                take: limit,
                where: {
                    OR: [{
                        BHYT: {
                            contains: search,
                        },
                    },
                    {
                        name: {
                            contains: search,
                        },
                    },
                    {
                        classcode: {
                            contains: search,
                        },
                    },
                    ],
                },
                include: {
                    invoice_mapping: {
                      where: {
                        OR: [{
                            billId: null,
                        },
                        {
                            billId: '',
                        },
                        {
                          bill: {
                            status: 'pending'
                          },
                        },
                        {
                          bill: {
                            status: 'cancel'
                          },
                        },
                        ],
                    },

                    },
                    parent: true,
                    school: true,
                },
            });
            count = await prisma.student.count({
                skip: (page - 1) * limit,
                take: limit,
                where: {
                    OR: [{
                        BHYT: {
                            contains: search,
                        },
                    },
                    {
                        name: {
                            contains: search,
                        },
                    },
                    {
                        classcode: {
                            contains: search,
                        },
                    },
                    ],
                },
            });
        }
        if (count === 0) {
            return res.status(400).json({ ok: false, message: "Kh??ng t??m th???y h???c sinh n??o!" });
        }

        return res.json({ ok: true, count: count, data: listStudent, message: "L???y th??ng tin h???c sinh th??nh c??ng!" });

    } catch (error) {
        console.log(error)
        return res.status(500).json({ ok: false, message: "Something went wrong" })
    }

}

// order by name
async function objSortFunction(field, sort) {
    try {
        var objSort;
        switch (field) {
            case 'bhyt':
                objSort = {
                    "BHYT": sort === 'asc' ? 'asc' : 'desc',
                }
                break;
            case 'name':
                objSort = {
                    "name": sort === 'asc' ? 'asc' : 'desc',
                }
                break;
            case 'classCode':
                objSort = {
                    "classcode": sort === 'asc' ? 'asc' : 'desc',
                }
                break;
            case 'gender':
                objSort = {
                    "gender": sort === 'asc' ? 'asc' : 'desc',
                }
                break;
            default:
                break;
        }
        return objSort;
    } catch (error) {
        console.log(error);
        return null;
    }
}

module.exports.getAllNoToken = async(req, res) => {
    try {
        var page = parseInt(req.query.page) || 1;
        var limit = parseInt(req.query.limit) || 10;
        // var search = req.query.search;
        // var sortParam = req.query.sort;
        // var fieldParam = req.query.field;
        var schoolId = parseInt(req.query.schoolId);
        var classCode = req.query.classCode;
        var name = req.query.name;
        var count = 0;
        var listStudent;
        // var sortObj;
        // sortObj = await objSortFunction(fieldParam, sortParam);

        // lay thong tin con
        listStudent = await prisma.student.findMany({
            // orderBy: {
            //     ...sortObj
            // },
            skip: (page - 1) * limit,
            take: limit,
            where: {
                schoolId: schoolId,
                classcode: classCode,
                name: name,
            },
            include: {
                invoice_mapping: {
                    where: {
                        OR: [{
                                billId: null,
                            },
                            {
                                billId: '',
                            },
                            {
                                bill: {
                                    status: 'pending'
                                },
                            },
                            {
                                bill: {
                                    status: 'cancel'
                                },
                            },
                        ],
                    },
                    include: {
                        invoice: true,
                    },
                },
                parent: true,
                school: {
                    select: {
                        id: true,
                        account: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
        });
        count = await prisma.student.count({
            where: {
                schoolId: schoolId,
                classcode: classCode,
                name: name,
            },
        });

        if (count === 0) {
            return res.status(400).json({ ok: false, message: "Kh??ng t??m th???y h???c sinh n??o!" });
        }

        return res.json({ ok: true, count: count, data: listStudent, message: "L???y th??ng tin h???c sinh th??nh c??ng!" });

    } catch (error) {
        console.log(error)
        return res.status(500).json({ ok: false, message: "Something went wrong" })
    }

}

// get one
module.exports.getOne = async(req, res) => {
    try {
        var userId = req.user.id;
        var id = parseInt(req.params.id);
        var student = null;
        // neu parent logged
        if (req.user.accRole === 'PARENT') {
            const parent = await prisma.parent.findUnique({
                where: {
                    accountId: userId,
                }
            });
            student = await prisma.student.findUnique({
                where: {
                    id: id,
                },
                include: {
                    invoice_mapping: {
                        where: {
                            OR: [{
                                    billId: null,
                                },
                                {
                                    billId: '',
                                },
                                {
                                    bill: {
                                        status: 'pending'
                                    },
                                },
                                {
                                    bill: {
                                        status: 'cancel'
                                    },
                                },
                            ],
                        },
                    },
                    parent: true,
                    school: true,
                }

            });
            if (student) {
                if (!(student.parentId === parent.id)) {
                    return res.status(400).json({
                        ok: false,
                        message: "B???n kh??ng ph???i ph??? huynh c???a h???c sinh n??y!"
                    })
                };
            };

        }
        // neu school logged
        else if (req.user.accRole === 'SCHOOL') {
            const school = await prisma.school.findUnique({
                where: {
                    accountId: userId,
                }
            })
            student = await prisma.student.findFirst({
                where: {
                    id: id,
                },
                include: {
                    invoice_mapping: {
                        where: {
                            OR: [{
                                    billId: null,
                                },
                                {
                                    billId: '',
                                },
                                {
                                    bill: {
                                        status: 'pending'
                                    },
                                },
                                {
                                    bill: {
                                        status: 'cancel'
                                    },
                                },
                            ],
                        },
                    },
                    parent: true,
                    school: true,
                }

            });
            if (student) {
                if (!(student.schoolId === school.id)) {
                    return res.status(400).json({
                        ok: false,
                        message: "H???c sinh n??y kh??ng thu???c tr?????ng!"
                    })
                }
            };
        }
        // neu admin logged
        else if (req.user.accRole === 'SUPERADMIN') {
            student = await prisma.student.findFirst({
                where: {
                    id: id,
                },
                include: {
                    invoice_mapping: {
                        where: {
                            OR: [{
                                    billId: null,
                                },
                                {
                                    billId: '',
                                },
                                {
                                    bill: {
                                        status: 'pending'
                                    },
                                },
                                {
                                    bill: {
                                        status: 'cancel'
                                    },
                                },
                            ],
                        },
                    },
                    parent: true,
                    school: true,
                }
            });
        }
        if (!student) {
            return res.status(400).json({ ok: false, message: "Kh??ng t??m th???y h???c sinh n??o!" })
        }
        return res.json({ ok: true, data: student, message: "L???y th??ng tin h???c sinh th??nh c??ng!" })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ ok: false, message: "Something went wrong" })
    }
}

// get one no token
module.exports.getOneNoToken = async(req, res) => {
    try {
        var bhyt = req.params.bhyt;
        var student = null;
        student = await prisma.student.findUnique({
            where: {
                BHYT: bhyt,
            },
            include: {
                invoice: {
                    where: {
                        updateDate: null
                    }
                },
                parent: {
                    select: {
                        phone: true,
                        childIds: true,
                    }
                },
                school: {
                    select: {
                        phone: true,
                        MST: true,
                        account: {
                            select: {
                                name: true,
                            }
                        },
                    },
                },
            }

        });
        if (!student) {
            return res.status(400).json({ ok: false, message: "Kh??ng t??m th???y h???c sinh n??o!" })
        }
        return res.json({ ok: true, data: student, message: "L???y th??ng tin h???c sinh th??nh c??ng!" })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ ok: false, message: "Something went wrong" })
    }
}

module.exports.createManyStudent = async function(req, res) {

    const school = await prisma.school.findUnique({ where: { accountId: req.user.id } });
    var mstOfSchool = school.MST;

    if (req.file == undefined) {
        return res.status(400).send({
            ok: false,
            message: "Vui lo??ng th??m file excel!"
        });
    }

    const file = reader.readFile(req.file.path);

    let data = []

    const sheets = file.SheetNames

    for (let i = 0; i < sheets.length; i++) {
        const temp = reader.utils.sheet_to_json(
            file.Sheets[file.SheetNames[i]])
        temp.forEach((res) => {
            data.push(res)
        })
    }

    // Printing data
    // console.log(data)

    for (let index = 0; index < data.length; index++) {
        if (data[index].BHYT === undefined ||
            data[index].MALOP === undefined || data[index].MST === undefined
        ) {
            return res.status(400).send({
                ok: false,
                message: "D???? li????u file excel ch??a ??u??ng!"
            });
        }
        if (data[index].MST !== school.MST) {
            return res.status(400).send({
                ok: false,
                message: "Co?? ho??c sinh sai MST, vui lo??ng ki????m tra la??i!"
            });
        }

    }

    // list th??ng tin sai (BHYT,SDT)
    let countAddedStudent = 0;
    // list ho??c sinh th??m bi?? l????i
    var listFailed = [];
    if (data.length === 0) {
        return res.status(400).send({
            ok: false,
            message: "Vui lo??ng nh????p d???? li????u va??o file excel!"
        });
    }
    try {
        // list sdt phuj huynh trong file excel
        const parentPhone = data.map(x => x.SDT);

        // BEGIN th??m ho????c update phu?? huynh
        // for (let index = 0; index < parentPhone.length; index++) {
        //     const element = parentPhone[index];
        //     if (element === undefined) {
        //         continue;
        //     } else {
        //         const upsertParent = await prisma.student.upsert({
        //             where: {
        //                 BHYT

        //             },
        //             update: {
        //                 phone: element.toString()
        //             },
        //             create: {
        //                 phone: element.toString(),
        //                 account: {
        //                     create: {
        //                         id: element,
        //                         name: 'Phu?? huynh m????i',
        //                         email: 'null' + element,
        //                         password: process.env.COMMONPASSWORD,
        //                         status: 'ACTIVE',
        //                         accRole: 'PARENT',
        //                     }
        //                 }
        //             }
        //         });
        //     }

        // } // END th??m phu?? huynh 
        // BEGIN th??m ho????c update ho??c sinh
        for (let index = 0; index < data.length; index++) {

            if (data[index].SDT === undefined) {
                listFailed.push(data[index].BHYT);
                continue;
            } else {
                const studentOfParent = await prisma.student.findUnique({
                    where: {
                        BHYT: data[index].BHYT

                    }
                });
                const parentOfStudent = await prisma.parent.findUnique({
                    where: {
                        phone: data[index].SDT
                    }
                })

                // n????u ??a?? co?? ho??c sinh t????n ta??i thi?? update sdt, ch??a thi?? th??m account +  parent
                if (!studentOfParent && !parentOfStudent) {
                    await prisma.account.create({
                        data: {
                            id: data[index].SDT,
                            name: 'Phu?? huynh m????i',
                            email: data[index].SDT + 'gmailNotfound',
                            password: process.env.COMMONPASSWORD,
                            status: 'ACTIVE',
                            accRole: 'PARENT',
                            parent: {
                                create: {
                                    phone: data[index].SDT
                                }
                            }
                        },

                    });
                } else if (studentOfParent && !parentOfStudent) {
                    console.log('Ho??c sinh ??a?? t????n ta??i nh??ng S??T ko t????n ta??i')
                    listFailed.push(data[index].BHYT);
                    continue;
                }
                // END th??m parent 

                const parent = await prisma.parent.findUnique({
                    where: {
                        phone: data[index].SDT.toString()
                    }
                });

                if (data[index].MST.toString() === mstOfSchool) {
                    let gioitinh;

                    if (data[index].GIOITINH !== undefined) {
                        gioitinh = (data[index].GIOITINH === 'N????' ||
                            data[index].GIOITINH === 'N????') ? 'FEMALE' : 'MALE'
                    } else {
                        gioitinh = null;
                    }

                    const createStudent = await prisma.student.upsert({
                        where: {
                            BHYT: data[index].BHYT.toString()
                        },
                        update: {
                            name: (data[index].HOTEN !== undefined) ? data[index].HOTEN : data[index].HO.concat(` ${data[index].TEN}`),
                            classcode: data[index].MALOP,
                            gender: (gioitinh !== null) ? gioitinh : 'UNKNOW',
                            parentId: parent.id
                        },
                        create: {
                            BHYT: data[index].BHYT.toString(),
                            name: (data[index].HOTEN !== undefined) ? data[index].HOTEN : data[index].HO.concat(` ${data[index].TEN}`),
                            classcode: data[index].MALOP,
                            schoolId: school.id,
                            parentId: parent.id,

                            gender: (gioitinh !== null) ? gioitinh : 'UNKNOW'
                        }
                    });
                    countAddedStudent++;
                } else {
                    listFailed.push(data[index].BHYT);
                }
            }


        } // END th??m ho??c sinh
        if (listFailed.length === 0) {
            return res.json({ ok: true, message: "Th??m " + countAddedStudent + " h???c sinh th??nh c??ng!" });
        }
        if (listFailed.length === data.length) {
            return res.status(400).json({ ok: false, message: "T???t c??? c??c h???c sinh b??? l???i!" });
        } else {
            return res.json({
                ok: true,
                message: "Th??m " + (data.length - listFailed.length) + " h???c sinh th??nh c??ng, c?? " +
                    listFailed.length + " h???c sinh b??? sai th??ng tin. Vui l??ng ch???nh s???a l???i c??c h???c sinh co?? BHYT sau ????y :",
                listFailed: listFailed
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({
            ok: false,
            error: "Student data wrong, please check file excel!"
        });

    } finally {
        async() =>
        await prisma.$disconnect()
    }
}

// create student from thanhat
module.exports.saveStudents = async(request, response) => {
    try {
        const school = await prisma.school.findUnique({ where: { accountId: request.user.id } });
        const students = await prisma.student.findMany({ select: { BHYT: true } });
        // bhyt co?? trong DB
        const bhyts = students.map(x => x.BHYT);
        // l????y dl t???? thanhat
        const res = await instance.post('/api/banks/nhan1truong', {
                MST: school.MST
            }, global.options)
            .catch(function(error) {
                console.log("L???y d??? li???u thanhat th???t b???i!")
                console.log(error.response.data)
            });
        const invoices = res.data.data;
        if (invoices.length === 0) {
            return response.status(400).json({ ok: false, message: "Ba??n kh??ng co?? ho??a ????n na??o trong tha??ng na??y!" });
        }
        var bhytsTN = [];
        invoices.forEach(element => {
            var student = {
                BHYT: element.MABHYT,
                phoneParent: element.TEL1,
                MST: element.MST,
                classcode: element.MALOP,
                name: element.HOTEN
            }
            bhytsTN.push(student)
        });

        // lucs na??y bhytsTN co?? t????t ca?? ca??c hoc sinh tr??n thanhat tha??ng na??y
        // x??a c??c bhyt tr??ng tr??n thanhat
        var bhytSet = new Set(bhytsTN);
        bhytsTN = Array.from(bhytSet);

        // x??a c??c s??? ???? c?? trong DB
        bhytsTN = bhytsTN.filter(val => !bhyts.includes(val.BHYT));
        if (bhytsTN.length === 0) {
            return response.status(400).json({ ok: false, message: "Kh??ng co?? ho??c sinh m????i trong tha??ng!" });
        }

        // list ca??c ho??c sinh add l????i
        var studentError = [];
        for (let index = 0; index < bhytsTN.length; index++) {
            const element = bhytsTN[index];
            var schoolOfStudent = await prisma.school.findUnique({ where: { MST: element.MST } });
            var parentOfStudent = await prisma.parent.findUnique({ where: { phone: element.phoneParent } });
            if (!parentOfStudent) {
                return response.status(400).json({ ok: false, message: "Phu?? huynh cu??a ho??c sinh ch??a t????n ta??i! Li??n h???? admin" });
            }
            var saveData = await prisma.student.create({
                data: {
                    BHYT: element.BHYT,
                    name: element.name,
                    classcode: element.classcode,
                    schoolId: schoolOfStudent.id,
                    parentId: parentOfStudent.id
                }
            });
            if (!saveData) {
                studentError.push(element)
            }
        }
        if (studentError.length !== 0) {
            return response.json({ ok: true, message: "L??u ca??c ho??c sinh " + studentError + " th????t ba??i!\n Xin ki????m tra la??i ca??c ho??c sinh na??y!" });
        } else {
            return response.json({ ok: true, message: "L??u t????t ca?? ho??c sinh tha??nh c??ng" });
        }

    } catch (error) {
        console.log(error);
        return response.status(404).json({ ok: false, message: "Something went wrong" });
    }
}
